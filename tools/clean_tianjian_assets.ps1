param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

Add-Type -AssemblyName System.Drawing

if (-not ('TianjianAssetCleaner' -as [type])) {
  Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class TianjianAssetCleaner
{
    private const int BytesPerPixel = 4;

    public static void CleanPortrait(string path)
    {
        if (!File.Exists(path)) return;
        using (var bitmap = LoadArgbBitmap(path))
        {
            ProcessBitmap(bitmap, new Rectangle(0, 0, bitmap.Width, bitmap.Height), IsWhiteBackdrop, true);
            bitmap.Save(path, ImageFormat.Png);
        }
    }

    public static void CleanSpritesheet(string path, int frameWidth, int frameHeight)
    {
        if (!File.Exists(path)) return;
        using (var bitmap = LoadArgbBitmap(path))
        {
            for (int top = 0; top < bitmap.Height; top += frameHeight)
            {
                for (int left = 0; left < bitmap.Width; left += frameWidth)
                {
                    var rect = new Rectangle(left, top, Math.Min(frameWidth, bitmap.Width - left), Math.Min(frameHeight, bitmap.Height - top));
                    ProcessBitmap(bitmap, rect, IsMagentaBackdrop, false);
                }
            }
            bitmap.Save(path, ImageFormat.Png);
        }
    }

    private static Bitmap LoadArgbBitmap(string path)
    {
        using (var source = Image.FromFile(path))
        {
            var bitmap = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
            using (var graphics = Graphics.FromImage(bitmap))
            {
                graphics.Clear(Color.Transparent);
                graphics.DrawImage(source, 0, 0, source.Width, source.Height);
            }
            return bitmap;
        }
    }

    private static void ProcessBitmap(Bitmap bitmap, Rectangle frame, Func<byte, byte, byte, byte, bool> isBackdrop, bool cleanWhite)
    {
        var rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        var data = bitmap.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        try
        {
            int length = Math.Abs(data.Stride) * bitmap.Height;
            byte[] pixels = new byte[length];
            Marshal.Copy(data.Scan0, pixels, 0, length);

            FloodTransparentFrame(pixels, data.Stride, bitmap.Width, bitmap.Height, frame, isBackdrop);
            ClearFrameBorder(pixels, data.Stride, frame, cleanWhite ? 1 : 2);
            Defringe(pixels, data.Stride, bitmap.Width, bitmap.Height, frame, isBackdrop, cleanWhite);
            NormalizeTransparentRgb(pixels, data.Stride, bitmap.Width, bitmap.Height, frame);

            Marshal.Copy(pixels, 0, data.Scan0, length);
        }
        finally
        {
            bitmap.UnlockBits(data);
        }
    }

    private static void FloodTransparentFrame(byte[] pixels, int stride, int width, int height, Rectangle frame, Func<byte, byte, byte, byte, bool> isBackdrop)
    {
        bool[] visited = new bool[frame.Width * frame.Height];
        var queue = new Queue<int>();

        Action<int, int> add = (x, y) =>
        {
            if (x < frame.Left || x >= frame.Right || y < frame.Top || y >= frame.Bottom) return;
            int local = (y - frame.Top) * frame.Width + (x - frame.Left);
            if (visited[local]) return;
            visited[local] = true;
            queue.Enqueue((y << 16) | x);
        };

        for (int x = frame.Left; x < frame.Right; x++)
        {
            add(x, frame.Top);
            add(x, frame.Bottom - 1);
        }
        for (int y = frame.Top; y < frame.Bottom; y++)
        {
            add(frame.Left, y);
            add(frame.Right - 1, y);
        }

        while (queue.Count > 0)
        {
            int packed = queue.Dequeue();
            int x = packed & 0xffff;
            int y = packed >> 16;
            int offset = GetOffset(stride, x, y);
            byte b = pixels[offset];
            byte g = pixels[offset + 1];
            byte r = pixels[offset + 2];
            byte a = pixels[offset + 3];

            if (!isBackdrop(r, g, b, a)) continue;

            pixels[offset] = 0;
            pixels[offset + 1] = 0;
            pixels[offset + 2] = 0;
            pixels[offset + 3] = 0;

            add(x + 1, y);
            add(x - 1, y);
            add(x, y + 1);
            add(x, y - 1);
        }
    }

    private static void Defringe(byte[] pixels, int stride, int width, int height, Rectangle frame, Func<byte, byte, byte, byte, bool> isBackdrop, bool cleanWhite)
    {
        byte[] copy = (byte[])pixels.Clone();
        for (int y = frame.Top; y < frame.Bottom; y++)
        {
            for (int x = frame.Left; x < frame.Right; x++)
            {
                int offset = GetOffset(stride, x, y);
                byte a = copy[offset + 3];
                if (a < 24 || !IsAdjacentTransparent(copy, stride, width, height, frame, x, y)) continue;

                byte b = copy[offset];
                byte g = copy[offset + 1];
                byte r = copy[offset + 2];
                if (!isBackdrop(r, g, b, a)) continue;

                if (cleanWhite)
                {
                    byte shade = (byte)Math.Min(232, (r + g + b) / 3);
                    pixels[offset] = shade;
                    pixels[offset + 1] = shade;
                    pixels[offset + 2] = shade;
                    pixels[offset + 3] = (byte)Math.Max(0, (int)(a * 0.52));
                }
                else
                {
                    pixels[offset] = (byte)Math.Min(b, g + 52);
                    pixels[offset + 1] = g;
                    pixels[offset + 2] = (byte)Math.Min(r, g + 36);
                    pixels[offset + 3] = (byte)Math.Max(0, (int)(a * 0.35));
                }
            }
        }
    }

    private static void ClearFrameBorder(byte[] pixels, int stride, Rectangle frame, int inset)
    {
        for (int y = frame.Top; y < frame.Bottom; y++)
        {
            for (int x = frame.Left; x < frame.Right; x++)
            {
                bool onBorder = x < frame.Left + inset || x >= frame.Right - inset || y < frame.Top + inset || y >= frame.Bottom - inset;
                if (!onBorder) continue;
                int offset = GetOffset(stride, x, y);
                pixels[offset] = 0;
                pixels[offset + 1] = 0;
                pixels[offset + 2] = 0;
                pixels[offset + 3] = 0;
            }
        }
    }

    private static void NormalizeTransparentRgb(byte[] pixels, int stride, int width, int height, Rectangle frame)
    {
        for (int y = frame.Top; y < frame.Bottom; y++)
        {
            for (int x = frame.Left; x < frame.Right; x++)
            {
                int offset = GetOffset(stride, x, y);
                if (pixels[offset + 3] != 0) continue;
                pixels[offset] = 0;
                pixels[offset + 1] = 0;
                pixels[offset + 2] = 0;
            }
        }
    }

    private static bool IsAdjacentTransparent(byte[] pixels, int stride, int width, int height, Rectangle frame, int x, int y)
    {
        for (int dy = -1; dy <= 1; dy++)
        {
            for (int dx = -1; dx <= 1; dx++)
            {
                if (dx == 0 && dy == 0) continue;
                int nx = x + dx;
                int ny = y + dy;
                if (nx < frame.Left || nx >= frame.Right || ny < frame.Top || ny >= frame.Bottom) continue;
                int offset = GetOffset(stride, nx, ny);
                if (pixels[offset + 3] < 24) return true;
            }
        }
        return false;
    }

    private static bool IsWhiteBackdrop(byte r, byte g, byte b, byte a)
    {
        if (a < 16) return true;
        byte max = Math.Max(r, Math.Max(g, b));
        byte min = Math.Min(r, Math.Min(g, b));
        return min > 214 && (max - min) < 34;
    }

    private static bool IsMagentaBackdrop(byte r, byte g, byte b, byte a)
    {
        if (a < 16) return true;
        bool magenta = r > 105 && b > 105 && g < 145 && r > g + 32 && b > g + 32;
        bool hotPink = r > 185 && b > 150 && g < 120;
        return magenta || hotPink;
    }

    private static int GetOffset(int stride, int x, int y)
    {
        return (y * stride) + (x * BytesPerPixel);
    }
}
'@
}

$portraitPath = Join-Path $Root 'public/assets/portraits/mecha/tianjian.png'
$sheetPath = Join-Path $Root 'public/assets/sprites/mecha/tianjian/spritesheet.png'

$timer = [System.Diagnostics.Stopwatch]::StartNew()
[TianjianAssetCleaner]::CleanPortrait($portraitPath)
[TianjianAssetCleaner]::CleanSpritesheet($sheetPath, 320, 360)
$timer.Stop()

Write-Host ("Cleaned Tianjian portrait and spritesheet edges in {0:N2}s." -f $timer.Elapsed.TotalSeconds)
