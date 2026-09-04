$env:JAVA_HOME = 'C:\Users\ME\.jdks\jbr-21.0.11'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

if (Test-Path 'C:\Users\ME\AppData\Local\Android\Sdk') {
    $env:ANDROID_HOME = 'C:\Users\ME\AppData\Local\Android\Sdk'
}

Set-Location -Path 'android'
Write-Host "Starting Gradle assembleDebug with JAVA_HOME=$env:JAVA_HOME and ANDROID_HOME=$env:ANDROID_HOME..."
.\gradlew.bat assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host "APK Built Successfully!"
    Get-ChildItem -Path 'app\build\outputs\apk\debug\*.apk' | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "Gradle build exited with code $LASTEXITCODE"
}
