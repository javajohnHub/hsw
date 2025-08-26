# RND Tournament Management - Self-Extracting Installer
# This script will extract and run the tournament management application

$ErrorActionPreference = "Stop"

# Create temporary directory
$tempDir = "$env:TEMP\RND-Tournament-Management-" + (Get-Random)
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    Write-Host "Extracting RND Tournament Management..." -ForegroundColor Green
    
    # Extract the embedded zip data (this would contain the app files)
    # For now, we'll copy from the existing location
    $sourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $appFiles = Join-Path $sourceDir "release\win-unpacked"
    
    if (Test-Path $appFiles) {
        Copy-Item -Path "$appFiles\*" -Destination $tempDir -Recurse -Force
        
        Write-Host "Starting RND Tournament Management..." -ForegroundColor Green
        $exePath = Join-Path $tempDir "RND Overlay Tournament Management.exe"
        
        if (Test-Path $exePath) {
            Start-Process -FilePath $exePath -Wait
        } else {
            Write-Host "Error: Application executable not found!" -ForegroundColor Red
            Read-Host "Press Enter to exit"
        }
    } else {
        Write-Host "Error: Application files not found!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
    }
} finally {
    # Cleanup
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
