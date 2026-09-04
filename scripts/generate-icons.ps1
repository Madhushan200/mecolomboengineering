Add-Type -AssemblyName System.Drawing

$sourcePath = 'C:\Users\ME\.gemini\antigravity-ide\brain\7f97f19a-c6f5-4704-8d26-a82898b0a279\.user_uploaded\media_1788510905315.jpg'
$img = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image($image, $width, $height, $outputPath) {
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $destImage = New-Object System.Drawing.Bitmap($width, $height)
    $destImage.SetResolution($image.HorizontalResolution, $image.VerticalResolution)
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($image, $destRect, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()
    $destImage.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destImage.Dispose()
    Write-Host "Generated: $outputPath ($width x $height)"
}

# Save to public directory
Copy-Item $sourcePath 'c:\Users\ME\.gemini\antigravity-ide\scratch\wedding-chamod-sisara\public\logo.jpg' -Force
Resize-Image $img 512 512 'c:\Users\ME\.gemini\antigravity-ide\scratch\wedding-chamod-sisara\public\logo.png'
Resize-Image $img 192 192 'c:\Users\ME\.gemini\antigravity-ide\scratch\wedding-chamod-sisara\public\icon-192.png'
Resize-Image $img 512 512 'c:\Users\ME\.gemini\antigravity-ide\scratch\wedding-chamod-sisara\public\icon-512.png'
Resize-Image $img 64 64 'c:\Users\ME\.gemini\antigravity-ide\scratch\wedding-chamod-sisara\public\favicon.png'

# Android mipmap densities
$densities = @{
    'mdpi' = @{ launcher = 48; foreground = 108 }
    'hdpi' = @{ launcher = 72; foreground = 162 }
    'xhdpi' = @{ launcher = 96; foreground = 216 }
    'xxhdpi' = @{ launcher = 144; foreground = 324 }
    'xxxhdpi' = @{ launcher = 192; foreground = 432 }
}

foreach ($d in $densities.Keys) {
    $dir = "c:\Users\ME\.gemini\antigravity-ide\scratch\wedding-chamod-sisara\android\app\src\main\res\mipmap-$d"
    if (Test-Path $dir) {
        $lSize = $densities[$d].launcher
        $fSize = $densities[$d].foreground
        Resize-Image $img $lSize $lSize "$dir\ic_launcher.png"
        Resize-Image $img $lSize $lSize "$dir\ic_launcher_round.png"
        Resize-Image $img $fSize $fSize "$dir\ic_launcher_foreground.png"
    }
}

$img.Dispose()
Write-Host "All Android icons & Web assets generated successfully!"
