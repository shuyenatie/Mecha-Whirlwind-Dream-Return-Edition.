param(
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

$frameW = 320
$frameH = 360
$cols = 6
$rows = 2
$sourcePath = Join-Path $ProjectDir "public\assets\portraits\mecha\tianjian.png"
$outDir = Join-Path $ProjectDir "public\assets\sprites\mecha\tianjian"
$sheetPath = Join-Path $outDir "spritesheet.png"
$animPath = Join-Path $outDir "animations.json"

if (-not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

function New-Canvas {
  param([int]$Width, [int]$Height)
  $bitmap = New-Object System.Drawing.Bitmap $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bitmap.SetResolution(96, 96)
  return $bitmap
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

  return New-Object System.Drawing.Rectangle $minX, $minY, (($maxX - $minX) + 1), (($maxY - $minY) + 1)
}

function Draw-Slash {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$FrameX,
    [int]$FrameY,
    [int]$Phase
  )

  $alpha = @(70, 185, 105)[$Phase]
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb($alpha, 67, 234, 255)), 9
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $rect = New-Object System.Drawing.Rectangle ($FrameX + 118), ($FrameY + 112), 172, 130
  $Graphics.DrawArc($pen, $rect, -48, 98)
  $pen.Dispose()

  $core = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb([Math]::Min(255, $alpha + 40), 230, 255, 255)), 2
  $Graphics.DrawArc($core, $rect, -44, 88)
  $core.Dispose()
}

function New-WeaponMaskPath {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath

  [System.Drawing.Point[]]$sword = @(
    (New-Object System.Drawing.Point 116, 252),
    (New-Object System.Drawing.Point 164, 244),
    (New-Object System.Drawing.Point 420, 536),
    (New-Object System.Drawing.Point 382, 572)
  )
  [System.Drawing.Point[]]$forearm = @(
    (New-Object System.Drawing.Point 82, 176),
    (New-Object System.Drawing.Point 164, 166),
    (New-Object System.Drawing.Point 180, 360),
    (New-Object System.Drawing.Point 104, 374)
  )
  [System.Drawing.Point[]]$hand = @(
    (New-Object System.Drawing.Point 138, 326),
    (New-Object System.Drawing.Point 198, 332),
    (New-Object System.Drawing.Point 196, 396),
    (New-Object System.Drawing.Point 126, 386)
  )

  $path.AddPolygon($sword)
  $path.AddPolygon($forearm)
  $path.AddPolygon($hand)
  return $path
}

function New-BodyLayer {
  param(
    [System.Drawing.Image]$Source,
    [System.Drawing.Drawing2D.GraphicsPath]$Mask
  )

  $bitmap = New-Canvas $Source.Width $Source.Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.DrawImage($Source, 0, 0, $Source.Width, $Source.Height)
  } finally {
    $graphics.Dispose()
  }
  return $bitmap
}

function New-MaskedLayer {
  param(
    [System.Drawing.Image]$Source,
    [System.Drawing.Drawing2D.GraphicsPath]$Mask
  )

  $bitmap = New-Canvas $Source.Width $Source.Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  try {
    $graphics.SetClip($Mask)
    $graphics.DrawImage($Source, 0, 0, $Source.Width, $Source.Height)
  } finally {
    $graphics.Dispose()
  }
  return $bitmap
}

function Get-FramePlacement {
  param(
    [System.Drawing.Rectangle]$Bounds,
    [int]$FrameX,
    [int]$FrameY
  )

  $targetH = 322
  $baseScale = $targetH / $Bounds.Height
  $targetW = $Bounds.Width * $baseScale
  $centerX = $FrameX + 160
  $bottomY = $FrameY + 334
  return @{
    Scale = $baseScale
    X = $centerX - ($targetW / 2)
    Y = $bottomY - $targetH
    Width = $targetW
    Height = $targetH
  }
}

function Draw-BaseShadow {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$FrameX,
    [int]$FrameY
  )

  $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(82, 0, 210, 190))
  $Graphics.FillEllipse($shadowBrush, $frameX + 78, $frameY + 326, 164, 24)
  $shadowBrush.Dispose()
}

function Draw-LayeredAttackFrame {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$BodyLayer,
    [System.Drawing.Image]$WeaponLayer,
    [System.Drawing.Rectangle]$Bounds,
    [int]$Index,
    [float]$WeaponRotation = 0,
    [float]$WeaponOffsetX = 0,
    [float]$WeaponOffsetY = 0,
    [int]$SlashPhase = 0
  )

  $frameX = ($Index % $cols) * $frameW
  $frameY = [Math]::Floor($Index / $cols) * $frameH
  Draw-BaseShadow $Graphics $frameX $frameY

  $placement = Get-FramePlacement $Bounds $frameX $frameY
  $dest = New-Object System.Drawing.RectangleF $placement.X, $placement.Y, $placement.Width, $placement.Height
  $Graphics.DrawImage($BodyLayer, $dest, $Bounds, [System.Drawing.GraphicsUnit]::Pixel)

  $pivotSourceX = 142
  $pivotSourceY = 330
  $pivotX = $placement.X + (($pivotSourceX - $Bounds.X) * $placement.Scale) + $WeaponOffsetX
  $pivotY = $placement.Y + (($pivotSourceY - $Bounds.Y) * $placement.Scale) + $WeaponOffsetY

  $state = $Graphics.Save()
  $Graphics.TranslateTransform($pivotX, $pivotY)
  $Graphics.RotateTransform($WeaponRotation)
  $Graphics.TranslateTransform(-$pivotX, -$pivotY)
  $weaponDest = New-Object System.Drawing.RectangleF ($dest.X + $WeaponOffsetX), ($dest.Y + $WeaponOffsetY), $dest.Width, $dest.Height
  $Graphics.DrawImage($WeaponLayer, $weaponDest, $Bounds, [System.Drawing.GraphicsUnit]::Pixel)
  $Graphics.Restore($state)

  Draw-Slash $Graphics $frameX $frameY $SlashPhase
}

function Draw-Frame {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Source,
    [System.Drawing.Rectangle]$Bounds,
    [int]$Index,
    [float]$OffsetX = 0,
    [float]$OffsetY = 0,
    [float]$ScaleX = 1,
    [float]$ScaleY = 1,
    [float]$Rotation = 0,
    [bool]$Slash = $false,
    [bool]$Hurt = $false
  )

  $frameX = ($Index % $cols) * $frameW
  $frameY = [Math]::Floor($Index / $cols) * $frameH

  Draw-BaseShadow $Graphics $frameX $frameY

  $targetH = 322 * $ScaleY
  $baseScale = $targetH / $Bounds.Height
  $targetW = $Bounds.Width * $baseScale * $ScaleX
  $drawH = $Bounds.Height * $baseScale
  $centerX = $frameX + 160 + $OffsetX
  $bottomY = $frameY + 334 + $OffsetY
  $drawX = -($targetW / 2)
  $drawY = -$drawH

  $state = $Graphics.Save()
  $Graphics.TranslateTransform($centerX, $bottomY)
  $Graphics.RotateTransform($Rotation)

  if ($Slash) {
    $ghostAttr = New-Object System.Drawing.Imaging.ImageAttributes
    $matrix = New-Object System.Drawing.Imaging.ColorMatrix
    $matrix.Matrix33 = 0.22
    $ghostAttr.SetColorMatrix($matrix)
    $ghostRect = New-Object System.Drawing.Rectangle ([int]($drawX - 22)), ([int]($drawY + 2)), ([int]$targetW), ([int]$drawH)
    $Graphics.DrawImage($Source, $ghostRect, $Bounds.X, $Bounds.Y, $Bounds.Width, $Bounds.Height, [System.Drawing.GraphicsUnit]::Pixel, $ghostAttr)
    $ghostAttr.Dispose()
  }

  $dest = New-Object System.Drawing.Rectangle ([int]$drawX), ([int]$drawY), ([int]$targetW), ([int]$drawH)
  $Graphics.DrawImage($Source, $dest, $Bounds, [System.Drawing.GraphicsUnit]::Pixel)

  $Graphics.Restore($state)

  if ($Slash) {
    Draw-Slash $Graphics $frameX $frameY ([Math]::Min(2, [Math]::Max(0, $Index - 6)))
  }
}

$source = [System.Drawing.Bitmap]::FromFile($sourcePath)
try {
  $bounds = Find-AlphaBounds $source
  $weaponMask = New-WeaponMaskPath
  $bodyLayer = New-BodyLayer $source $weaponMask
  $weaponLayer = New-MaskedLayer $source $weaponMask
  $sheet = New-Canvas ($frameW * $cols) ($frameH * $rows)
  $graphics = [System.Drawing.Graphics]::FromImage($sheet)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  try {
    Draw-Frame $graphics $source $bounds 0 0 0 1 1 0
    Draw-Frame $graphics $source $bounds 1 0 -5 1.01 0.99 0
    Draw-Frame $graphics $source $bounds 2 -12 2 1 1.01 0
    Draw-Frame $graphics $source $bounds 3 4 -2 1.01 1 0
    Draw-Frame $graphics $source $bounds 4 12 1 1 1.01 0
    Draw-Frame $graphics $source $bounds 5 -2 0 1.01 1 0
    Draw-LayeredAttackFrame $graphics $bodyLayer $weaponLayer $bounds 6 -24 -8 0 0
    Draw-LayeredAttackFrame $graphics $bodyLayer $weaponLayer $bounds 7 28 18 -2 1
    Draw-LayeredAttackFrame $graphics $bodyLayer $weaponLayer $bounds 8 10 8 0 2
    Draw-Frame $graphics $source $bounds 9 2 -34 0.98 1.02 -3
    Draw-Frame $graphics $source $bounds 10 0 10 1.02 0.96 3
    Draw-Frame $graphics $source $bounds 11 -18 0 0.96 1.01 -9 $false $true
  } finally {
    $graphics.Dispose()
  }

  $sheet.Save($sheetPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $sheet.Dispose()
  $bodyLayer.Dispose()
  $weaponLayer.Dispose()
  $weaponMask.Dispose()
} finally {
  $source.Dispose()
}

$animations = @{
  frameWidth = $frameW
  frameHeight = $frameH
  animations = @(
    @{ key = "mecha_tianjian_idle"; startFrame = 0; endFrame = 1; frameRate = 4; repeat = -1 },
    @{ key = "mecha_tianjian_run"; startFrame = 2; endFrame = 5; frameRate = 10; repeat = -1 },
    @{ key = "mecha_tianjian_attack"; startFrame = 6; endFrame = 8; frameRate = 14; repeat = 0 },
    @{ key = "mecha_tianjian_skill"; startFrame = 6; endFrame = 8; frameRate = 11; repeat = 0 },
    @{ key = "mecha_tianjian_jump"; startFrame = 9; endFrame = 10; frameRate = 7; repeat = 0 },
    @{ key = "mecha_tianjian_hurt"; startFrame = 11; endFrame = 11; frameRate = 8; repeat = 0 }
  )
}

$json = $animations | ConvertTo-Json -Depth 4
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($animPath, $json, $utf8NoBom)
Write-Host "Built Tianjian spritesheet: $sheetPath"
