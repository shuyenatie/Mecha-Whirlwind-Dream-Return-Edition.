param(
  [Parameter(Mandatory = $true)]
  [string]$SourceDir,
  [string]$ProjectDir = ""
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectDir)) {
  $scriptPath = $PSCommandPath
  if ([string]::IsNullOrWhiteSpace($scriptPath)) {
    $scriptPath = $MyInvocation.MyCommand.Path
  }
  $ProjectDir = (Resolve-Path (Join-Path (Split-Path -Parent $scriptPath) "..")).Path
}

function Ensure-Dir {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function New-Canvas {
  param([int]$Width, [int]$Height)
  $bitmap = New-Object System.Drawing.Bitmap $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bitmap.SetResolution(96, 96)
  return $bitmap
}

function Use-Graphics {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [scriptblock]$Draw
  )

  $graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  try {
    & $Draw $graphics
  } finally {
    $graphics.Dispose()
  }
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  Ensure-Dir (Split-Path -Parent $Path)
  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Save-CoverImage {
  param(
    [string]$SourcePath,
    [string]$DestPath,
    [int]$Width,
    [int]$Height,
    $SourceRect
  )

  $source = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    if ($null -eq $SourceRect) {
      $SourceRect = New-Object System.Drawing.RectangleF 0, 0, $source.Width, $source.Height
    }

    $sourceRatio = $SourceRect.Width / $SourceRect.Height
    $targetRatio = $Width / $Height
    if ($sourceRatio -gt $targetRatio) {
      $cropWidth = $SourceRect.Height * $targetRatio
      $SourceRect.X += ($SourceRect.Width - $cropWidth) / 2
      $SourceRect.Width = $cropWidth
    } else {
      $cropHeight = $SourceRect.Width / $targetRatio
      $SourceRect.Y += ($SourceRect.Height - $cropHeight) / 2
      $SourceRect.Height = $cropHeight
    }

    $bitmap = New-Canvas $Width $Height
    Use-Graphics $bitmap {
      param($graphics)
      $destRect = New-Object System.Drawing.RectangleF 0, 0, $Width, $Height
      $graphics.DrawImage($source, $destRect, $SourceRect, [System.Drawing.GraphicsUnit]::Pixel)

      $scanBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(32, 2, 10, 24))
      for ($y = 0; $y -lt $Height; $y += 4) {
        $graphics.FillRectangle($scanBrush, 0, $y, $Width, 1)
      }
      $scanBrush.Dispose()

      $topShade = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle 0, 0, $Width, $Height),
        ([System.Drawing.Color]::FromArgb(105, 3, 8, 18)),
        ([System.Drawing.Color]::FromArgb(35, 3, 8, 18)),
        [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
      )
      $graphics.FillRectangle($topShade, 0, 0, $Width, $Height)
      $topShade.Dispose()
    }

    Save-Png $bitmap $DestPath
    $bitmap.Dispose()
  } finally {
    $source.Dispose()
  }
}

function Save-GroundStrip {
  param(
    [string]$SourcePath,
    [string]$DestPath
  )

  $source = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    $bitmap = New-Canvas 512 96
    $src = New-Object System.Drawing.RectangleF 0, ($source.Height * 0.58), ($source.Width * 0.5), ($source.Height * 0.28)
    Use-Graphics $bitmap {
      param($graphics)
      $destRect = New-Object System.Drawing.RectangleF 0, 0, 512, 96
      $graphics.DrawImage($source, $destRect, $src, [System.Drawing.GraphicsUnit]::Pixel)
      $rim = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(190, 134, 237, 255)), 3
      $graphics.DrawLine($rim, 0, 6, 512, 6)
      $rim.Dispose()
    }
    Save-Png $bitmap $DestPath
    $bitmap.Dispose()
  } finally {
    $source.Dispose()
  }
}

function Save-TechGroundStrip {
  param(
    [string]$SourcePath,
    [string]$DestPath
  )

  $source = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    $bitmap = New-Canvas 512 96
    $src = New-Object System.Drawing.RectangleF 0, ($source.Height * 0.64), $source.Width, ($source.Height * 0.22)
    Use-Graphics $bitmap {
      param($graphics)
      $destRect = New-Object System.Drawing.RectangleF 0, 0, 512, 96
      $graphics.DrawImage($source, $destRect, $src, [System.Drawing.GraphicsUnit]::Pixel)
      $shade = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(72, 2, 8, 18))
      $graphics.FillRectangle($shade, 0, 0, 512, 96)
      $shade.Dispose()
      $rim = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(210, 94, 226, 255)), 3
      $graphics.DrawLine($rim, 0, 8, 512, 8)
      $rim.Dispose()
    }
    Save-Png $bitmap $DestPath
    $bitmap.Dispose()
  } finally {
    $source.Dispose()
  }
}

function Make-TransparentBorderWhite {
  param([System.Drawing.Bitmap]$Bitmap)

  $width = $Bitmap.Width
  $height = $Bitmap.Height
  $queue = New-Object "System.Collections.Generic.Queue[System.Drawing.Point]"
  $seen = New-Object "bool[,]" $width, $height

  function Test-BackgroundPixel {
    param([System.Drawing.Color]$Color)
    $nearWhite = ($Color.R -ge 218 -and $Color.G -ge 218 -and $Color.B -ge 218)
    $nearBlack = ($Color.R -le 12 -and $Color.G -le 12 -and $Color.B -le 12)
    return ($Color.A -le 16 -or $nearWhite -or $nearBlack)
  }

  for ($x = 0; $x -lt $width; $x++) {
    $queue.Enqueue((New-Object System.Drawing.Point $x, 0))
    $queue.Enqueue((New-Object System.Drawing.Point $x, ($height - 1)))
  }
  for ($y = 0; $y -lt $height; $y++) {
    $queue.Enqueue((New-Object System.Drawing.Point 0, $y))
    $queue.Enqueue((New-Object System.Drawing.Point ($width - 1), $y))
  }

  while ($queue.Count -gt 0) {
    $point = $queue.Dequeue()
    $x = $point.X
    $y = $point.Y
    if ($x -lt 0 -or $x -ge $width -or $y -lt 0 -or $y -ge $height -or $seen[$x, $y]) {
      continue
    }

    $seen[$x, $y] = $true
    $color = $Bitmap.GetPixel($x, $y)
    if (-not (Test-BackgroundPixel $color)) {
      continue
    }

    $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    $queue.Enqueue((New-Object System.Drawing.Point ($x + 1), $y))
    $queue.Enqueue((New-Object System.Drawing.Point ($x - 1), $y))
    $queue.Enqueue((New-Object System.Drawing.Point $x, ($y + 1)))
    $queue.Enqueue((New-Object System.Drawing.Point $x, ($y - 1)))
  }
}

function Save-TianjianPortrait {
  param(
    [string]$SourcePath,
    [string]$DestPath
  )

  $source = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    $bitmap = New-Canvas 512 640
    Use-Graphics $bitmap {
      param($graphics)
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $src = New-Object System.Drawing.RectangleF 0, 24, $source.Width, ($source.Height - 58)
      $targetRatio = 512 / 640
      $srcRatio = $src.Width / $src.Height
      if ($srcRatio -gt $targetRatio) {
        $drawW = 470
        $drawH = [int]($drawW / $srcRatio)
      } else {
        $drawH = 594
        $drawW = [int]($drawH * $srcRatio)
      }
      $dx = [int]((512 - $drawW) / 2)
      $dy = [int]((640 - $drawH) / 2)
      $destRect = New-Object System.Drawing.RectangleF $dx, $dy, $drawW, $drawH
      $graphics.DrawImage($source, $destRect, $src, [System.Drawing.GraphicsUnit]::Pixel)
    }

    Make-TransparentBorderWhite $bitmap
    Save-Png $bitmap $DestPath
    $bitmap.Dispose()
  } finally {
    $source.Dispose()
  }
}

$backgroundDir = Join-Path $ProjectDir "public\assets\backgrounds"
$portraitDir = Join-Path $ProjectDir "public\assets\portraits\mecha"

function Find-Asset {
  param([string]$Pattern)
  $match = Get-ChildItem -LiteralPath $SourceDir -Filter $Pattern | Select-Object -First 1
  if ($null -eq $match) {
    throw "Missing source asset matching $Pattern in $SourceDir"
  }
  return $match.FullName
}

$menuSource = Find-Asset "*53_82.jpg"
$selectSource = Find-Asset "*71_82.jpg"
$stageSource = Find-Asset "*54_82.jpg"
$skyArtillerySource = Find-Asset "*55_82.jpg"
$baseLabSource = Find-Asset "*71_82.jpg"
$baseHangarSource = Find-Asset "*73_82.jpg"
$stationCorridorSource = Find-Asset "*75_82.jpg"
$stationExploreSource = Find-Asset "*77_82.jpg"
$commandRoomSource = Find-Asset "*79_82.jpg"
$voidPlazaSource = Find-Asset "*72_82.jpg"
$tianjianSource = Find-Asset "tianjian.png"

Save-CoverImage $menuSource (Join-Path $backgroundDir "menu.png") 1280 720 $null
Save-CoverImage $selectSource (Join-Path $backgroundDir "character_select.png") 1280 720 $null
Save-CoverImage $stageSource (Join-Path $backgroundDir "stage_earth_layer_sky.png") 1280 720 (New-Object System.Drawing.RectangleF 0, 0, 1690, 1240)
Save-GroundStrip $stageSource (Join-Path $backgroundDir "stage_earth_ground.png")
Save-CoverImage $stageSource (Join-Path $backgroundDir "stage_moon_battle.png") 1280 720 (New-Object System.Drawing.RectangleF 0, 0, 3380, 1240)
Save-CoverImage $skyArtillerySource (Join-Path $backgroundDir "stage_sky_artillery.png") 1280 720 $null
Save-CoverImage $baseLabSource (Join-Path $backgroundDir "stage_base_lab.png") 1280 720 $null
Save-CoverImage $baseHangarSource (Join-Path $backgroundDir "stage_base_hangar.png") 1280 720 $null
Save-CoverImage $stationCorridorSource (Join-Path $backgroundDir "stage_station_corridor.png") 1280 720 $null
Save-CoverImage $stationExploreSource (Join-Path $backgroundDir "stage_station_explore.png") 1280 720 $null
Save-CoverImage $commandRoomSource (Join-Path $backgroundDir "stage_command_room.png") 1280 720 $null
Save-CoverImage $voidPlazaSource (Join-Path $backgroundDir "stage_void_plaza.png") 1280 720 $null
Save-GroundStrip $stageSource (Join-Path $backgroundDir "stage_ground_moon.png")
Save-TechGroundStrip $stationCorridorSource (Join-Path $backgroundDir "stage_ground_tech.png")
Save-TianjianPortrait $tianjianSource (Join-Path $portraitDir "tianjian.png")

$scriptDir = Split-Path -Parent $scriptPath
$generatedPoseSheet = Join-Path $ProjectDir "public\assets\sprites\mecha\tianjian\generated_pose_sheet_source.png"
$aiImporter = Join-Path $scriptDir "import_ai_tianjian_frames.ps1"
$animBuilder = Join-Path $scriptDir "build_tianjian_animation.ps1"
if ((Test-Path -LiteralPath $generatedPoseSheet) -and (Test-Path -LiteralPath $aiImporter)) {
  & $aiImporter -ProjectDir $ProjectDir -SourcePath $generatedPoseSheet
} elseif (Test-Path -LiteralPath $animBuilder) {
  & $animBuilder -ProjectDir $ProjectDir
}

$cleaner = Join-Path $scriptDir "clean_tianjian_assets.ps1"
if (Test-Path -LiteralPath $cleaner) {
  & $cleaner -Root $ProjectDir
}

Write-Host "Imported reference visual assets from $SourceDir"
