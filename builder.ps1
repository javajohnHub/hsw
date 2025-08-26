
# Edwards Web Development - Full Build and Package Script
# Usage: .\builder.ps1 [-NoBuild]
param(
  [switch]$NoBuild
)
$ErrorActionPreference = 'Stop'

# Robust project root detection
if ($PSScriptRoot) {
  $root = Resolve-Path $PSScriptRoot
} elseif ($MyInvocation.MyCommand.Path) {
  $root = Resolve-Path (Split-Path -Parent $MyInvocation.MyCommand.Path)
} else {
  $root = Resolve-Path (Get-Location)
}
$root = $root.Path


Write-Host "Project root: $root"

# Define backendDir early so it is available for all uses
$backendDir = Join-Path $root 'backend'

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$pkgDir = Join-Path $root "package_ready_$stamp"
$distDir = Join-Path $root "dist"
$zipPath = Join-Path $distDir "mybizsite-package-$stamp.zip"

function RunNpmBuild($subpath) {
  $full = Join-Path $root $subpath
  if (-not (Test-Path $full)) {
    Write-Host "Skipping build; path not found: $full"
    return
  }
  $pkgJson = Join-Path $full 'package.json'
  if (-not (Test-Path $pkgJson)) {
    Write-Host "No package.json in $full; skipping npm build."
    return
  }
  try {
    $pkg = Get-Content $pkgJson -Raw | ConvertFrom-Json
  } catch {
    Write-Host "Unable to read package.json at $pkgJson; skipping npm build."
    return
  }
  if (-not $pkg.scripts -or -not $pkg.scripts.build) {
    Write-Host "No build script in $pkgJson; skipping npm run build."
    return
  }
  Write-Host "-> npm ci in $full"
  npm --prefix $full ci
  Write-Host "-> npm run build in $full"
  try {
    npm --prefix $full run build
  } catch {
    Write-Host "npm run build failed for $full; continuing packaging."
  }
}



# Prepare output folders
Write-Host "Preparing output folders..."
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $pkgDir
New-Item -ItemType Directory -Path $pkgDir | Out-Null
if (-not (Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir | Out-Null }

# Copy frontend/dist and package files
$frontendDir = Join-Path $root 'frontend'
$frontendDist = Join-Path $frontendDir 'dist'
$frontendDst = Join-Path $pkgDir 'frontend'
if (Test-Path $frontendDist) {
  Copy-Item -Path $frontendDist -Destination $frontendDst -Recurse -Force
  Write-Host "Copied frontend/dist to package."
} else {
  Write-Host "Warning: frontend/dist not found; frontend build may have failed."
}
$frontendPkg = Join-Path $frontendDir 'package.json'
if (Test-Path $frontendPkg) { Copy-Item -Path $frontendPkg -Destination $frontendDst -Force }
$frontendLock = Join-Path $frontendDir 'package-lock.json'
if (Test-Path $frontendLock) { Copy-Item -Path $frontendLock -Destination $frontendDst -Force }

# Copy frontend build output as 'public' in the package root

# Always copy frontend build output into backend/public for deployment
$frontendProject = $null
if (Test-Path $frontendDist) {
  $frontendProject = Get-ChildItem -Directory $frontendDist | Select-Object -First 1
  if ($frontendProject) {
    $backendPublic = Join-Path $backendDir 'public'
    if (Test-Path $backendPublic) {
      Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $backendPublic
    }
    New-Item -ItemType Directory -Path $backendPublic | Out-Null
    Write-Host "Copying frontend build output from $($frontendProject.FullName) to $backendPublic (for backend static serving)"
    Copy-Item -Path (Join-Path $frontendProject.FullName '*') -Destination $backendPublic -Recurse -Force
    # Also copy to package public for legacy/fallback
    $publicDst = Join-Path $pkgDir 'public'
    Copy-Item -Path (Join-Path $frontendProject.FullName '*') -Destination $publicDst -Recurse -Force
  } else {
    Write-Host "No project folder found under frontend/dist; skipping backend/public copy."
  }
} elseif (Test-Path (Join-Path $root 'public')) {
  $publicSrc = Join-Path $root 'public'
  $backendPublic = Join-Path $backendDir 'public'
  if (Test-Path $backendPublic) {
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $backendPublic
  }
  New-Item -ItemType Directory -Path $backendPublic | Out-Null
  Write-Host "Copying root-level public directory from $publicSrc to $backendPublic (for backend static serving)"
  Copy-Item -Path $publicSrc -Destination $backendPublic -Recurse -Force
  # Also copy to package public for legacy/fallback
  $publicDst = Join-Path $pkgDir 'public'
  Copy-Item -Path $publicSrc -Destination $publicDst -Recurse -Force
} else {
  Write-Host "No frontend build output or root-level public directory found; static files may be missing."
}

# Build all parts in a single step unless -NoBuild
if ($NoBuild) {
  Write-Host "Skipping build steps (NoBuild set)."
} else {
  Write-Host "Running root build: npm run build:ci"
  pushd $root
  try {
    npm run build:ci
  } catch {
    Write-Host "Root build failed; attempting to continue packaging with any existing artifacts."
  } finally {
    popd
  }
}

# Copy backend/dist and package files

# Always include backend/dist and backend/public in the package
$backendDir = Join-Path $root 'backend'
$backendDist = Join-Path $backendDir 'dist'
$backendPublic = Join-Path $backendDir 'public'
$backendDst = Join-Path $pkgDir 'backend'

if (Test-Path $backendDist) {
  Copy-Item -Path $backendDist -Destination $backendDst -Recurse -Force
  Write-Host "Copied backend/dist to package."
} else {
  Write-Host "Warning: backend/dist not found; backend build may have failed."
}
if (Test-Path $backendPublic) {
  Copy-Item -Path $backendPublic -Destination (Join-Path $backendDst 'public') -Recurse -Force
  Write-Host "Copied backend/public to package."
} else {
  Write-Host "Warning: backend/public not found; frontend may not be served."
}
$backendPkg = Join-Path $backendDir 'package.json'
if (Test-Path $backendPkg) { Copy-Item -Path $backendPkg -Destination $backendDst -Force }
$backendLock = Join-Path $backendDir 'package-lock.json'
if (Test-Path $backendLock) { Copy-Item -Path $backendLock -Destination $backendDst -Force }

# Build/copy tournament client
if ($NoBuild) {
  Write-Host "Skipping tournament client build (NoBuild set)."
} else {
  Write-Host "Building tournament client..."
  RunNpmBuild "tournament-app\client"
}
$clientDir = Join-Path $root "tournament-app\client"
$clientDistRoot = Join-Path $clientDir 'dist'
$clientDst = Join-Path $pkgDir 'tournament-app\client'
if (Test-Path $clientDistRoot) {
  Copy-Item -Path $clientDistRoot -Destination $clientDst -Recurse -Force
  Write-Host "Copied tournament-app/client/dist to package."
} else {
  Write-Host "Client dist not found; skipping tournament client dist copy."
}
$clientPkg = Join-Path $clientDir 'package.json'
if (Test-Path $clientPkg) { Copy-Item -Path $clientPkg -Destination $clientDst -Force }
$clientLock = Join-Path $clientDir 'package-lock.json'
if (Test-Path $clientLock) { Copy-Item -Path $clientLock -Destination $clientDst -Force }

# Build/copy tournament server
if ($NoBuild) {
  Write-Host "Skipping tournament server build (NoBuild set)."
} else {
  Write-Host "Building tournament server..."
  try {
    RunNpmBuild "tournament-app\server"
  } catch {
    Write-Host "Build failed or not present; copying server source instead."
  }
}
$serverDir = Join-Path $root "tournament-server"
$serverDist = Join-Path $root "tournament-app\server\dist"
$serverDst = $serverDir
if (Test-Path $serverDist) {
  Copy-Item -Path $serverDist -Destination $serverDst -Recurse -Force
  Write-Host "Copied tournament-app/server/dist to tournament-server."
} else {
  Write-Host "Warning: tournament-app/server/dist not found; tournament server build may have failed."
}
$serverPkg = Join-Path $serverDir 'package.json'
if (Test-Path $serverPkg) { Copy-Item -Path $serverPkg -Destination $serverDir -Force }
$serverLock = Join-Path $serverDir 'package-lock.json'
if (Test-Path $serverLock) { Copy-Item -Path $serverLock -Destination $serverDir -Force }

# Copy minimal root files (exclude .env)
$filesToCopy = @("ecosystem.all.config.js","package.json","README.md")
foreach ($f in $filesToCopy) {
  $src = Join-Path $root $f
  if (Test-Path $src) { Copy-Item -Path $src -Destination $pkgDir -Force }
}

# Ensure .env is not included
Remove-Item -Path (Join-Path $pkgDir '.env') -ErrorAction SilentlyContinue

# --- CLEANED SUMMARY AND ZIP SECTION ---
Write-Host "`n--- PACKAGE CONTENTS SUMMARY ---"
if (Test-Path (Join-Path $pkgDir 'backend\dist\server.js')) {
  Write-Host "✔ backend/dist/server.js present"
} else {
  Write-Host "✖ backend/dist/server.js MISSING"
}
if (Test-Path (Join-Path $pkgDir 'frontend\dist')) {
  Write-Host "✔ frontend/dist present"
} else {
  Write-Host "✖ frontend/dist MISSING"
}
if (Test-Path (Join-Path $pkgDir 'tournament-app\client\dist')) {
  Write-Host "✔ tournament-app/client/dist present"
} else {
  Write-Host "✖ tournament-app/client/dist MISSING"
}
if (Test-Path (Join-Path $pkgDir 'tournament-server\index.js')) {
  Write-Host "✔ tournament-server/index.js present"
} else {
  Write-Host "✖ tournament-server/index.js MISSING"
}
if (Test-Path (Join-Path $pkgDir 'public\index.html')) {
  Write-Host "✔ public/index.html present"
} else {
  Write-Host "✖ public/index.html MISSING"
}
Write-Host "-------------------------------`n"

# --- PACKAGE CONTENTS SUMMARY ---
Write-Host "`n--- PACKAGE CONTENTS SUMMARY ---"
if (Test-Path (Join-Path $pkgDir 'backend\dist\server.js')) {
  Write-Host "✔ backend/dist/server.js present"
} else {
  Write-Host "✖ backend/dist/server.js MISSING"
}
if (Test-Path (Join-Path $pkgDir 'frontend\dist')) {
  Write-Host "✔ frontend/dist present"
} else {
  Write-Host "✖ frontend/dist MISSING"
}
if (Test-Path (Join-Path $pkgDir 'tournament-app\client\dist')) {
  Write-Host "✔ tournament-app/client/dist present"
} else {
  Write-Host "✖ tournament-app/client/dist MISSING"
}
if (Test-Path (Join-Path $pkgDir 'tournament-server\index.js')) {
  Write-Host "✔ tournament-server/index.js present"
} else {
  Write-Host "✖ tournament-server/index.js MISSING"
}
if (Test-Path (Join-Path $pkgDir 'public\index.html')) {
  Write-Host "✔ public/index.html present"
} else {
  Write-Host "✖ public/index.html MISSING"
}
Write-Host "-------------------------------`n"

# Create zip
Write-Host "Creating zip: $zipPath"
if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}
Compress-Archive -Path (Join-Path $pkgDir '*') -DestinationPath $zipPath -Force

Write-Host "Done. Package created: $zipPath"


