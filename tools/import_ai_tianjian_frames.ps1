param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,
  [string]$ProjectDir = ""
)

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectDir)) {
  $scriptPath = $PSCommandPath
  if ([string]::IsNullOrWhiteSpace($scriptPath)) {
    $scriptPath = $MyInvocation.MyCommand.Path
  }
  $ProjectDir = (Resolve-Path (Join-Path (Split-Path -Parent $scriptPath) "..")).Path
}

$frameW = 420
$frameH = 420
$cols = 6
$rows = 2
$outDir = Join-Path $ProjectDir "public\assets\sprites\mecha\tianjian"
$sheetPath = Join-Path $outDir "spritesheet.png"
$animPath = Join-Path $outDir "animations.json"
$sourceCopyPath = Join-Path $outDir "generated_pose_sheet_source.png"

if (-not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$isSourceCopy = [System.IO.Path]::GetFileName($SourcePath) -eq "generated_pose_sheet_source.png" -and (Test-Path -LiteralPath $sourceCopyPath)
if (-not $isSourceCopy) {
  Copy-Item -LiteralPath $SourcePath -Destination $sourceCopyPath -Force
}

function New-Canvas {
  param([int]$Width, [int]$Height)
  $bitmap = New-Object System.Drawing.Bitmap $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bitmap.SetResolution(96, 96)
  return $bitmap
}

function Remove-Magenta {
  param([System.Drawing.Bitmap]$Bitmap)

  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      $c = $Bitmap.GetPixel($x, $y)
      $isMagenta = $c.R -gt 145 -and $c.B -gt 145 -and $c.G -lt 135 -and (($c.R + $c.B) -gt ($c.G * 3))
      if ($isMagenta) {
        $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      } elseif ($c.R -gt 110 -and $c.B -gt 150 -and $c.G -lt 150) {
        $despillR = [Math]::Min($c.R, [Math]::Max(0, $c.G + 28))
        $despillB = [Math]::Min($c.B, [Math]::Max($c.G + 45, 90))
        $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($c.A, $despillR, $c.G, $despillB))
      }
    }
  }
}

function Find-AlphaBounds {
  param([System.Drawing.Bitmap]$Bitmap)

  $minX = $Bitmap.Width
  $minY = $Bitmap.Height
  $maxX = 0
  $maxY = 0
  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      $color = $Bitmap.GetPixel($x, $y)
      if ($color.A -gt 24) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -le $minX -or $maxY -le $minY) {
    return New-Object System.Drawing.Rectangle 0, 0, $Bitmap.Width, $Bitmap.Height
  }

  return New-Object System.Drawing.Rectangle $minX, $minY, (($maxX - $minX) + 1), (($maxY - $minY) + 1)
}

$source = [System.Drawing.Bitmap]::FromFile($SourcePath)
try {
  $sheet = New-Canvas ($frameW * $cols) ($frameH * $rows)
  $graphics = [System.Drawing.Graphics]::FromImage($sheet)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  try {
    $cellW = [double]$source.Width / $cols
    $cellH = [double]$source.Height / $rows

    for ($i = 0; $i -lt ($cols * $rows); $i++) {
      $col = $i % $cols
      $row = [Math]::Floor($i / $cols)
      $srcRect = New-Object System.Drawing.Rectangle ([int]($col * $cellW)), ([int]($row * $cellH)), ([int][Math]::Ceiling($cellW)), ([int][Math]::Ceiling($cellH))

      $cell = New-Canvas $srcRect.Width $srcRect.Height
      $cellGraphics = [System.Drawing.Graphics]::FromImage($cell)
      $cellGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $cellGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      try {
        $cellGraphics.DrawImage($source, (New-Object System.Drawing.Rectangle 0, 0, $srcRect.Width, $srcRect.Height), $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
      } finally {
        $cellGraphics.Dispose()
      }

      Remove-Magenta $cell
      $bounds = Find-AlphaBounds $cell

      $targetH = if ($i -ge 6 -and $i -le 8) { 344 } elseif ($i -eq 10) { 306 } else { 334 }
      $scale = [Math]::Min(($frameW - 76) / $bounds.Width, $targetH / $bounds.Height)
      $drawW = [int]($bounds.Width * $scale)
      $drawH = [int]($bounds.Height * $scale)
      $dx = [int](($frameW - $drawW) / 2) + ($col * $frameW)
      $dy = [int]($frameH - $drawH - 16) + ($row * $frameH)
      if ($i -eq 9) { $dy -= 24 }
      if ($i -eq 10) { $dy += 18 }

      $dest = New-Object System.Drawing.Rectangle $dx, $dy, $drawW, $drawH
      $graphics.DrawImage($cell, $dest, $bounds, [System.Drawing.GraphicsUnit]::Pixel)
      $cell.Dispose()
    }
  } finally {
    $graphics.Dispose()
  }

  $sheet.Save($sheetPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $sheet.Dispose()
} finally {
  $source.Dispose()
}

$animations = @{
  frameWidth = $frameW
  frameHeight = $frameH
  animations = @(
    @{ key = "mecha_tianjian_idle"; startFrame = 0; endFrame = 1; frameRate = 4; repeat = -1 },
    @{ key = "mecha_tianjian_run"; startFrame = 2; endFrame = 5; frameRate = 10; repeat = -1 },
    @{ key = "mecha_tianjian_attack"; startFrame = 6; endFrame = 8; frameRate = 13; repeat = 0 },
    @{ key = "mecha_tianjian_skill"; startFrame = 6; endFrame = 8; frameRate = 10; repeat = 0 },
    @{ key = "mecha_tianjian_jump"; startFrame = 9; endFrame = 10; frameRate = 7; repeat = 0 },
    @{ key = "mecha_tianjian_hurt"; startFrame = 11; endFrame = 11; frameRate = 8; repeat = 0 }
  )
}

$json = $animations | ConvertTo-Json -Depth 4
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($animPath, $json, $utf8NoBom)

$cleaner = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "clean_tianjian_assets.ps1"
if (Test-Path -LiteralPath $cleaner) {
  & $cleaner -Root $ProjectDir
}

Write-Host "Imported generated Tianjian action frames: $sheetPath"
