<#
build_frontend.ps1
Runs `npm run build` in `tournament-app/client` with retries and caching guidance.
Usage:
  powershell -ExecutionPolicy Bypass -File build_frontend.ps1 [-Retries 3] [-DelaySeconds 5]
#>
param(
    [int]$Retries = 3,
    [int]$DelaySeconds = 5
)
$clientDir = Join-Path $PWD "tournament-app\client"
if (-not (Test-Path $clientDir)) {
    Write-Error "Client folder not found at $clientDir"
    exit 1
}

Push-Location $clientDir
for ($i = 1; $i -le $Retries; $i++) {
    Write-Host "Running frontend build attempt $i of $Retries..."
    $res = npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Frontend build succeeded"
        Pop-Location
        exit 0
    }
    Write-Host "Build failed (exit $LASTEXITCODE)."
    if ($i -lt $Retries) {
        Write-Host "Retrying in $DelaySeconds seconds..."
        Start-Sleep -Seconds $DelaySeconds
    }
}
Pop-Location
Write-Error "Frontend build failed after $Retries attempts. Check logs and try locally."
exit 1
