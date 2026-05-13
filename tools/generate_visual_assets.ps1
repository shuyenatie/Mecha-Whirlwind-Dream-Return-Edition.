Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$assets = Join-Path $root 'public/assets'

function Ensure-Dir($path) {
  if ([string]::IsNullOrWhiteSpace($path)) {
    return
  }
  if (-not (Test-Path -LiteralPath $path)) {
    New-Item -ItemType Directory -Force -Path $path | Out-Null
  }
}

function Save-Png($bitmap, $path) {
  if ([string]::IsNullOrWhiteSpace($path)) {
    throw 'Save-Png received an empty output path.'
  }
  Ensure-Dir (Split-Path -Parent $path)
  if (Test-Path -LiteralPath $path) {
    Remove-Item -LiteralPath $path -Force
  }
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function New-Bitmap($w, $h) {
  $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bmp.SetResolution(96, 96)
  return $bmp
}

function New-Color($hex, $alpha = 255) {
  return [System.Drawing.Color]::FromArgb($alpha, (($hex -shr 16) -band 255), (($hex -shr 8) -band 255), ($hex -band 255))
}

function New-Brush($hex, $alpha = 255) {
  return New-Object System.Drawing.SolidBrush (New-Color $hex $alpha)
}

function New-Pen($hex, $width = 1, $alpha = 255) {
  return New-Object System.Drawing.Pen (New-Color $hex $alpha), $width
}

function New-RoundedPath($rect, $radius) {
  $diameter = $radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($rect.Left, $rect.Top, $diameter, $diameter, 180, 90)
  $path.AddArc($rect.Right - $diameter, $rect.Top, $diameter, $diameter, 270, 90)
  $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($rect.Left, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-Stars($g, $w, $h, $count, $seed) {
  $rng = [System.Random]::new($seed)
  for ($i = 0; $i -lt $count; $i++) {
    $x = $rng.Next(0, $w)
    $y = $rng.Next(0, $h)
    $s = 1 + $rng.Next(0, 3)
    $a = 60 + $rng.Next(0, 150)
    $b = New-Brush 0x8edbff $a
    $g.FillEllipse($b, $x, $y, $s, $s)
    $b.Dispose()
  }
}

function Draw-CircuitLines($g, $w, $h, $seed, $color) {
  $rng = [System.Random]::new($seed)
  for ($i = 0; $i -lt 34; $i++) {
    $x = $rng.Next(-100, $w)
    $y = $rng.Next(20, $h - 20)
    $len = $rng.Next(80, 260)
    $pen = New-Pen $color 2 (40 + $rng.Next(0, 70))
    $g.DrawLine($pen, $x, $y, $x + $len, $y)
    $g.DrawLine($pen, $x + $len, $y, $x + $len + 32, $y + $rng.Next(-36, 36))
    $g.FillEllipse((New-Brush $color 110), $x + $len - 4, $y - 4, 8, 8)
    $pen.Dispose()
  }
}

function Draw-MenuBackground($path) {
  $w = 1280; $h = 720
  $bmp = New-Bitmap $w $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (New-Color 0x030714), (New-Color 0x12255a), 90
  $g.FillRectangle($bg, $rect)
  $bg.Dispose()
  Draw-Stars $g $w $h 180 10

  $planet = New-Object System.Drawing.Drawing2D.GraphicsPath
  $planet.AddEllipse(820, 40, 520, 520)
  $pBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush $planet
  $pBrush.CenterColor = New-Color 0x2a92ff 120
  $pBrush.SurroundColors = @((New-Color 0x090c2a 0))
  $g.FillPath($pBrush, $planet)
  $pBrush.Dispose(); $planet.Dispose()

  $hangar = New-Brush 0x081120 210
  $g.FillPolygon($hangar, @(
    [System.Drawing.Point]::new(0, 720),
    [System.Drawing.Point]::new(0, 470),
    [System.Drawing.Point]::new(250, 370),
    [System.Drawing.Point]::new(565, 440),
    [System.Drawing.Point]::new(1280, 390),
    [System.Drawing.Point]::new(1280, 720)
  ))
  $hangar.Dispose()

  $beamPen = New-Pen 0x44ccff 3 90
  foreach ($x in 80, 260, 460, 760, 980, 1180) {
    $g.DrawLine($beamPen, $x, 430, $x - 120, 720)
  }
  $beamPen.Dispose()
  Draw-CircuitLines $g $w $h 12 0x32a9ff

  $g.Dispose()
  Save-Png $bmp $path
}

function Draw-CharacterSelectBackground($path) {
  $w = 1280; $h = 720
  $bmp = New-Bitmap $w $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (New-Color 0x071024), (New-Color 0x1c2845), 90
  $g.FillRectangle($bg, $rect); $bg.Dispose()
  Draw-Stars $g $w $h 110 22

  $floor = New-Object System.Drawing.Drawing2D.LinearGradientBrush ([System.Drawing.Rectangle]::new(0, 470, $w, 250)), (New-Color 0x111a30), (New-Color 0x030712), 90
  $g.FillRectangle($floor, 0, 470, $w, 250); $floor.Dispose()

  for ($i = 0; $i -lt 12; $i++) {
    $x = 80 + $i * 105
    $pen = New-Pen 0x4fd2ff 2 70
    $g.DrawLine($pen, $x, 480, $x - 220, 720)
    $pen.Dispose()
  }
  for ($i = 0; $i -lt 8; $i++) {
    $y = 500 + $i * 30
    $pen = New-Pen 0x225ea8 1 80
    $g.DrawLine($pen, 0, $y, $w, $y)
    $pen.Dispose()
  }

  Draw-CircuitLines $g $w 460 31 0x64e7ff
  $g.Dispose()
  Save-Png $bmp $path
}

function Draw-StageLayer($path, $kind) {
  $w = 1280; $h = 720
  $bmp = New-Bitmap $w $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  if ($kind -eq 'sky') {
    $rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
    $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (New-Color 0x061129), (New-Color 0x1b3b7a), 90
    $g.FillRectangle($bg, $rect); $bg.Dispose()
    Draw-Stars $g $w $h 130 41
    $glow = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glow.AddEllipse(860, 80, 300, 300)
    $brush = New-Object System.Drawing.Drawing2D.PathGradientBrush $glow
    $brush.CenterColor = New-Color 0x89edff 110
    $brush.SurroundColors = @((New-Color 0x89edff 0))
    $g.FillPath($brush, $glow)
    $brush.Dispose(); $glow.Dispose()
  }

  if ($kind -eq 'mid') {
    $clear = New-Brush 0x000000 0
    $g.FillRectangle($clear, 0, 0, $w, $h); $clear.Dispose()
    for ($i = 0; $i -lt 11; $i++) {
      $x = -80 + $i * 140
      $height = 180 + (($i * 43) % 160)
      $b = New-Brush 0x10213b 190
      $g.FillRectangle($b, $x, 380 - $height, 110, $height)
      $b.Dispose()
      $line = New-Pen 0x3588ff 2 85
      $g.DrawRectangle($line, $x + 10, 390 - $height, 90, $height - 20)
      $line.Dispose()
    }
  }

  if ($kind -eq 'fore') {
    $clear = New-Brush 0x000000 0
    $g.FillRectangle($clear, 0, 0, $w, $h); $clear.Dispose()
    for ($i = 0; $i -lt 9; $i++) {
      $x = -100 + $i * 180
      $b = New-Brush 0x071020 215
      $g.FillPolygon($b, @(
        [System.Drawing.Point]::new($x, 650),
        [System.Drawing.Point]::new($x + 95, 330),
        [System.Drawing.Point]::new($x + 170, 650)
      ))
      $b.Dispose()
      $p = New-Pen 0x4bdcff 3 80
      $g.DrawLine($p, $x + 95, 330, $x + 150, 650)
      $p.Dispose()
    }
  }

  $g.Dispose()
  Save-Png $bmp $path
}

function Draw-Ground($path) {
  $w = 512; $h = 96
  $bmp = New-Bitmap $w $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush ([System.Drawing.Rectangle]::new(0, 0, $w, $h)), (New-Color 0x30465f), (New-Color 0x101824), 90
  $g.FillRectangle($bg, 0, 0, $w, $h); $bg.Dispose()
  $top = New-Brush 0x7ee8ff 170
  $g.FillRectangle($top, 0, 0, $w, 5); $top.Dispose()
  for ($x = 0; $x -lt $w; $x += 64) {
    $pen = New-Pen 0x1b2738 3 220
    $g.DrawLine($pen, $x, 8, $x + 48, 86)
    $g.DrawLine($pen, $x + 48, 8, $x, 86)
    $pen.Dispose()
  }
  $g.Dispose()
  Save-Png $bmp $path
}

function Draw-Portrait($path, $primary, $secondary, $accent, $weapon) {
  $w = 512; $h = 640
  $bmp = New-Bitmap $w $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush ([System.Drawing.Rectangle]::new(0, 0, $w, $h)), (New-Color 0x071022), (New-Color 0x111b33), 90
  $g.FillRectangle($bg, 0, 0, $w, $h); $bg.Dispose()
  $glow = New-Object System.Drawing.Drawing2D.GraphicsPath
  $glow.AddEllipse(76, 70, 360, 430)
  $pb = New-Object System.Drawing.Drawing2D.PathGradientBrush $glow
  $pb.CenterColor = New-Color $primary 110
  $pb.SurroundColors = @((New-Color $primary 0))
  $g.FillPath($pb, $glow)
  $pb.Dispose(); $glow.Dispose()

  $outline = New-Pen 0x02050c 10 230
  $edge = New-Pen $accent 4 210
  $main = New-Brush $primary 245
  $sub = New-Brush $secondary 245
  $hi = New-Brush $accent 245
  $dark = New-Brush 0x111827 255

  $g.FillPolygon($dark, @([System.Drawing.Point]::new(160, 190), [System.Drawing.Point]::new(256, 110), [System.Drawing.Point]::new(354, 190), [System.Drawing.Point]::new(332, 275), [System.Drawing.Point]::new(178, 275)))
  $g.DrawPolygon($outline, @([System.Drawing.Point]::new(160, 190), [System.Drawing.Point]::new(256, 110), [System.Drawing.Point]::new(354, 190), [System.Drawing.Point]::new(332, 275), [System.Drawing.Point]::new(178, 275)))
  $g.FillPolygon($main, @([System.Drawing.Point]::new(190, 188), [System.Drawing.Point]::new(256, 132), [System.Drawing.Point]::new(322, 188), [System.Drawing.Point]::new(304, 246), [System.Drawing.Point]::new(208, 246)))
  $g.FillRectangle($hi, 224, 205, 64, 12)
  $g.DrawPolygon($edge, @([System.Drawing.Point]::new(190, 188), [System.Drawing.Point]::new(256, 132), [System.Drawing.Point]::new(322, 188), [System.Drawing.Point]::new(304, 246), [System.Drawing.Point]::new(208, 246)))

  $g.FillPolygon($sub, @([System.Drawing.Point]::new(126, 275), [System.Drawing.Point]::new(386, 275), [System.Drawing.Point]::new(330, 470), [System.Drawing.Point]::new(180, 470)))
  $g.DrawPolygon($outline, @([System.Drawing.Point]::new(126, 275), [System.Drawing.Point]::new(386, 275), [System.Drawing.Point]::new(330, 470), [System.Drawing.Point]::new(180, 470)))
  $g.FillPolygon($main, @([System.Drawing.Point]::new(154, 286), [System.Drawing.Point]::new(358, 286), [System.Drawing.Point]::new(312, 442), [System.Drawing.Point]::new(200, 442)))
  $g.FillEllipse($hi, 224, 318, 64, 64)

  $g.FillPolygon($main, @([System.Drawing.Point]::new(70, 300), [System.Drawing.Point]::new(142, 250), [System.Drawing.Point]::new(172, 318), [System.Drawing.Point]::new(114, 410)))
  $g.FillPolygon($main, @([System.Drawing.Point]::new(442, 300), [System.Drawing.Point]::new(370, 250), [System.Drawing.Point]::new(340, 318), [System.Drawing.Point]::new(398, 410)))
  $g.FillRectangle($dark, 180, 450, 48, 120)
  $g.FillRectangle($dark, 284, 450, 48, 120)
  $g.FillRectangle($main, 170, 555, 72, 30)
  $g.FillRectangle($main, 270, 555, 72, 30)

  $weaponPen = New-Pen $accent 10 235
  switch ($weapon) {
    'sword' { $g.DrawLine($weaponPen, 112, 520, 398, 172) }
    'gun' { $g.DrawLine($weaponPen, 340, 370, 480, 330); $g.DrawLine($weaponPen, 392, 352, 430, 405) }
    'claw' { $g.DrawLine($weaponPen, 76, 470, 154, 354); $g.DrawLine($weaponPen, 92, 500, 172, 372) }
    'chain' { for ($i=0; $i -lt 8; $i++) { $g.DrawEllipse($weaponPen, 70 + $i*34, 500 - $i*18, 24, 14) } }
    'spear' { $g.DrawLine($weaponPen, 388, 560, 214, 110); $g.FillPolygon($hi, @([System.Drawing.Point]::new(200, 96), [System.Drawing.Point]::new(230, 126), [System.Drawing.Point]::new(180, 142))) }
    'ice' { $g.DrawLine($weaponPen, 256, 540, 256, 120); $g.FillPolygon($hi, @([System.Drawing.Point]::new(256, 80), [System.Drawing.Point]::new(300, 150), [System.Drawing.Point]::new(256, 190), [System.Drawing.Point]::new(212, 150))) }
  }
  $weaponPen.Dispose()

  $outline.Dispose(); $edge.Dispose(); $main.Dispose(); $sub.Dispose(); $hi.Dispose(); $dark.Dispose()
  $g.Dispose()
  Save-Png $bmp $path
}

function Draw-Effect($path, $kind) {
  $w = 512; $h = 256
  $bmp = New-Bitmap $w $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $clear = New-Brush 0x000000 0
  $g.FillRectangle($clear, 0, 0, $w, $h); $clear.Dispose()
  if ($kind -eq 'slash') {
    for ($i = 0; $i -lt 5; $i++) {
      $pen = New-Pen 0x6df2ff (18 - $i * 3) (55 + $i * 35)
      $g.DrawArc($pen, 50 + $i*10, 34 + $i*7, 390 - $i*18, 160 - $i*14, 190, 130)
      $pen.Dispose()
    }
  } elseif ($kind -eq 'burst') {
    for ($i = 0; $i -lt 18; $i++) {
      $angle = $i * 20 * [Math]::PI / 180
      $pen = New-Pen 0x7ee8ff 6 160
      $g.DrawLine($pen, 256, 128, [int](256 + [Math]::Cos($angle)*210), [int](128 + [Math]::Sin($angle)*95))
      $pen.Dispose()
    }
    $b = New-Brush 0xffffff 210
    $g.FillEllipse($b, 206, 78, 100, 100); $b.Dispose()
  } else {
    for ($i = 0; $i -lt 8; $i++) {
      $pen = New-Pen 0x5cecff (9 - [Math]::Min($i, 7)) (180 - $i*15)
      $g.DrawLine($pen, 40 + $i*10, 50 + $i*18, 460 - $i*18, 34 + $i*22)
      $pen.Dispose()
    }
  }
  $g.Dispose()
  Save-Png $bmp $path
}

function Draw-Ui($path, $kind) {
  $w = 512; $h = 192
  $bmp = New-Bitmap $w $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $clear = New-Brush 0x000000 0
  $g.FillRectangle($clear, 0, 0, $w, $h); $clear.Dispose()
  $base = if ($kind -eq 'gold') { 0x8b5f18 } elseif ($kind -eq 'card') { 0x162033 } else { 0x173b78 }
  $accent = if ($kind -eq 'gold') { 0xffdd66 } else { 0x63e9ff }
  $rect = [System.Drawing.Rectangle]::new(18, 24, 476, 136)
  $roundedPath = New-RoundedPath $rect 14
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (New-Color $base 235), (New-Color 0x050913 235), 90
  $g.FillPath($brush, $roundedPath)
  $brush.Dispose()
  $pen = New-Pen $accent 4 210
  $g.DrawPath($pen, $roundedPath)
  $pen.Dispose()
  $roundedPath.Dispose()
  $shine = New-Brush 0xffffff 42
  $g.FillRectangle($shine, 34, 38, 444, 16)
  $shine.Dispose()
  $g.Dispose()
  Save-Png $bmp $path
}

Draw-MenuBackground (Join-Path $assets 'backgrounds/menu.png')
Draw-CharacterSelectBackground (Join-Path $assets 'backgrounds/character_select.png')
Draw-StageLayer (Join-Path $assets 'backgrounds/stage_earth_layer_sky.png') 'sky'
Draw-StageLayer (Join-Path $assets 'backgrounds/stage_earth_layer_mid.png') 'mid'
Draw-StageLayer (Join-Path $assets 'backgrounds/stage_earth_layer_fore.png') 'fore'
Draw-Ground (Join-Path $assets 'backgrounds/stage_earth_ground.png')

$portraitDir = Join-Path $assets 'portraits/mecha'
Draw-Portrait (Join-Path $portraitDir 'tianjian.png') 0x2f8cff 0x183f8f 0xbbe8ff 'sword'
Draw-Portrait (Join-Path $portraitDir 'qiangpao.png') 0xff3d36 0x7a1b22 0xffc06a 'gun'
Draw-Portrait (Join-Path $portraitDir 'shanying.png') 0x2fe680 0x11643b 0xc6ffd9 'claw'
Draw-Portrait (Join-Path $portraitDir 'lianren.png') 0xff8a18 0x69360d 0xffe4a0 'chain'
Draw-Portrait (Join-Path $portraitDir 'shengqiang.png') 0xffd64a 0x7c6217 0xffffc2 'spear'
Draw-Portrait (Join-Path $portraitDir 'hanxing.png') 0x75dfff 0x1d5f88 0xf2ffff 'ice'

Draw-Effect (Join-Path $assets 'effects/slash_arc.png') 'slash'
Draw-Effect (Join-Path $assets 'effects/energy_burst.png') 'burst'
Draw-Effect (Join-Path $assets 'effects/speed_trail.png') 'trail'

Draw-Ui (Join-Path $assets 'ui/panel_metal.png') 'panel'
Draw-Ui (Join-Path $assets 'ui/button_blue.png') 'blue'
Draw-Ui (Join-Path $assets 'ui/button_gold.png') 'gold'
Draw-Ui (Join-Path $assets 'ui/card_frame.png') 'card'

Write-Host "Generated visual remake PNG assets in $assets"
