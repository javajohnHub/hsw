<#
build_deploy_zip.ps1

Creates a deployable zip containing:
 - backend (server) folder
 - backend/data (if present)
 - built frontend at tournament-app/client/dist (copied to /www)
 - nginx site config (nginx-site.conf)
 - start scripts (start-backend.sh and start-backend.bat)

Usage (PowerShell):
  .\build_deploy_zip.ps1 -OutFile "deploy-package.zip" -Force

Notes:
 - This script does NOT run npm build for you. Build the frontend first with:
     npm --prefix tournament-app/client run build
   or run the project's normal build script.
 - The script is idempotent and will overwrite the output zip if -Force is used.
#>
param(
    [string]$OutFile = "deploy-package.zip",
    [string]$TmpDir = "$PWD\deploy-package",
    [switch]$Force,
    [switch]$BuildFrontend,
    [switch]$CreateTarGz
)

function Abort($msg) {
    Write-Error $msg
    exit 1
}

# Resolve repo root (folder where this script lives) so script works from any CWD
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

# If TmpDir wasn't provided by the caller, default to <repo>/deploy-package
if (-not $PSBoundParameters.ContainsKey('TmpDir')) {
    $TmpDir = Join-Path $RepoRoot 'deploy-package'
}

if ((Test-Path $OutFile -PathType Leaf) -and (-not $Force)) {
    Abort("Output file '$OutFile' already exists. Use -Force to overwrite.")
}

# Clean tmp dir
if (Test-Path $TmpDir) { Remove-Item -Recurse -Force $TmpDir }
New-Item -ItemType Directory -Path $TmpDir | Out-Null

# Copy backend (resolve from repo root)
$backendSrc = Join-Path $RepoRoot 'backend'
if (-not (Test-Path $backendSrc)) { Abort("backend folder not found at $backendSrc") }
Write-Host "Copying backend..."
Copy-Item -Recurse -Force -Path $backendSrc -Destination (Join-Path $TmpDir 'backend')

# Copy server (tournament-app server if exists)
 $taServer = Join-Path $RepoRoot 'tournament-app\server'
if (Test-Path $taServer) {
    Write-Host "Copying tournament-app/server..."
    Copy-Item -Recurse -Force -Path $taServer -Destination $TmpDir\tournament-app-server
}

# Copy backend/data if exists
 $backendData = Join-Path $RepoRoot 'backend\data'
if (Test-Path $backendData) {
    Write-Host "Copying backend/data..."
    # already included by copying backend, but ensure it's present explicitly
} else {
    Write-Host "No backend/data found, skipping."
}

# Copy frontend built dist (common locations)
$possibleDist = @(
    (Join-Path $RepoRoot 'tournament-app\client\dist'),
    (Join-Path $RepoRoot 'frontend\dist'),
    (Join-Path $RepoRoot 'client\dist')
)
$found = $false
foreach ($d in $possibleDist) {
    if (Test-Path $d) {
        Write-Host "Copying frontend dist from $d to /www..."
        New-Item -ItemType Directory -Path (Join-Path $TmpDir 'www') | Out-Null
        $srcPattern = Join-Path $d '*'
        Copy-Item -Recurse -Force -Path $srcPattern -Destination (Join-Path $TmpDir 'www')
        $found = $true
        break
    }
}
if (-not $found) {
    Write-Host "Warning: no frontend dist found in common locations. Build the frontend and re-run or place dist in one of:" -ForegroundColor Yellow
    $possibleDist | ForEach-Object { Write-Host "  $_" }
}

# Optionally build frontend before packaging
if ($BuildFrontend) {
    $clientPkg = Join-Path $RepoRoot 'tournament-app\client\package.json'
    if (Test-Path $clientPkg) {
        Write-Host "Building frontend (npm run build)..."
        Push-Location (Join-Path $RepoRoot 'tournament-app\client')
        npm run build
        Pop-Location

        # attempt to copy dist again if it was built into dist
        $built = Join-Path $RepoRoot 'tournament-app\client\dist'
        if (Test-Path $built) {
            New-Item -ItemType Directory -Path (Join-Path $TmpDir 'www') -Force | Out-Null
            Copy-Item -Recurse -Force -Path (Join-Path $built '*') -Destination (Join-Path $TmpDir 'www')
            Write-Host "Copied built frontend to $TmpDir\www"
            $found = $true
        }
    } else {
        Write-Host "No frontend package.json found; skipping build." -ForegroundColor Yellow
    }
}

# Copy root nginx config if present
$nginxConf = Join-Path $RepoRoot 'nginx.conf'
if (Test-Path $nginxConf) {
    Copy-Item -Force -Path $nginxConf -Destination $TmpDir\nginx.conf
} else {
    # create an example nginx site config
    $example = @"
# Example nginx site config for this app (save as /etc/nginx/sites-available/tournament.conf)
server {
    listen 80;
    server_name example.com; # change

    root /var/www/tournament; # this should point to the 'www' folder from the zip
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/; # backend application
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    access_log /var/log/nginx/tournament.access.log;
    error_log /var/log/nginx/tournament.error.log;
}
"@
    $example | Out-File -Encoding utf8 -FilePath $TmpDir\nginx-site.conf
}

# Add a simple start script for the backend (systemd or pm2 recommended in production)
$startSh = @"
#!/bin/sh
# Start backend (basic)
cd /opt/tournament/backend || exit 1
# install deps (only if needed)
# npm ci
node index.js
"@
$startBat = @"
@echo off
cd %~dp0\\backend
node index.js
"@
$startSh | Out-File -Encoding utf8 -FilePath $TmpDir\start-backend.sh
$startBat | Out-File -Encoding utf8 -FilePath $TmpDir\start-backend.bat

# Create README with deploy steps
$readme = @"
Deploy package contents:
 - backend/            -> node/express backend (start with node index.js)
 - tournament-app-server/ -> optional server from tournament-app (if present)
 - www/                -> built frontend (nginx should serve this)
 - nginx-site.conf     -> example nginx server block
 - start-backend.sh    -> simple start (not a production startup)
 - start-backend.bat   -> Windows start script

Quick server steps (on Ubuntu):
1) Copy the zip contents to the server, place frontend at /var/www/tournament
2) Install Node/npm and restore backend dependencies
   cd /opt/tournament/backend
   npm ci
3) Configure nginx using the provided nginx-site.conf (edit server_name and paths)
   sudo mv nginx-site.conf /etc/nginx/sites-available/tournament.conf
   sudo ln -s /etc/nginx/sites-available/tournament.conf /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
4) Start backend (use pm2 or systemd for reliability):
   # example with pm2
   npm i -g pm2
   pm2 start index.js --name tournament-backend --cwd /opt/tournament/backend
   pm2 save

Notes:
 - This package builder does not run builds for you. Ensure the frontend is built and its output copied into a dist folder before running this script.
 - Adjust paths and ports to match your server layout.
"@
$readme | Out-File -Encoding utf8 -FilePath $TmpDir\README_DEPLOY.md

# Copy optional pm2 ecosystem and systemd unit if present at repo root
 $ecos = Join-Path $RepoRoot 'ecosystem.config.js'
if (Test-Path $ecos) { Copy-Item -Force -Path $ecos -Destination (Join-Path $TmpDir 'ecosystem.config.js') }
 $svc = Join-Path $RepoRoot 'tournament-backend.service'
if (Test-Path $svc) { Copy-Item -Force -Path $svc -Destination (Join-Path $TmpDir 'tournament-backend.service') }

# Create zip
if ($CreateTarGz) {
    # create tar.gz using built-in tar on Windows 10+ or fallback to Compress-Archive then convert
    $tarPath = Resolve-Path "$TmpDir"
    $tgz = $OutFile
    if ((Test-Path $tgz) -and (-not $Force)) { Abort("Output file '$tgz' already exists. Use -Force to overwrite.") }
    if (Test-Path $tgz) { Remove-Item -Force $tgz }
    Write-Host "Creating tar.gz $tgz..."
    # Use tar if available
    try {
        tar -C $TmpDir -czf $tgz .\*
        Write-Host "Created $tgz"
    } catch {
        Write-Host "tar not available or failed; creating zip fallback" -ForegroundColor Yellow
        $zipOut = [System.IO.Path]::ChangeExtension($tgz, '.zip')
        if (Test-Path $zipOut) { Remove-Item -Force $zipOut }
        Compress-Archive -Path $TmpDir\* -DestinationPath $zipOut -Force
        Write-Host "Created $zipOut"
    }
    Write-Host "Temporary files remain at $TmpDir (remove if desired)."
} else {
    if (Test-Path $OutFile) { Remove-Item -Force $OutFile }
    Write-Host "Creating zip $OutFile..."
    Compress-Archive -Path $TmpDir\* -DestinationPath $OutFile -Force
    Write-Host "Created $OutFile. Temporary files remain at $TmpDir (remove if desired)."
}
