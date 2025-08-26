<#
oneclick_deploy.ps1

One-command build, package and deploy to a remote test server running nginx.
Usage (PowerShell):
  .\oneclick_deploy.ps1 -Target user@host [-RemoteDir /var/www/tournament] [-SshKey C:\path\to\key] [-Package tournament-deploy.tar.gz] [-Force]

What it does:
 - Builds frontend (npm --prefix tournament-app/client run build)
 - Packages app into a tar.gz using build_deploy_zip.ps1
 - Secure-copies package to remote /tmp
 - SSH to remote and:
    - extracts package to /tmp/deploy_tmp
    - moves content: www -> <RemoteDir> (default /var/www/tournament)
                   backend -> /opt/tournament/backend
    - installs nginx site (nginx-site.conf) if present and restarts nginx
    - installs backend deps and starts with pm2 (installs pm2 if missing)
    - cleans temporary files

Notes:
 - Requires ssh and scp available on the machine running this script.
 - Remote user must have sudo privileges for file moves, service restarts and npm installs.
 - This is a convenience test deploy for a staging/testing server.
#>
param(
  [string]$Target = $null,
  [string]$RemoteDir = '/var/www/tournament',
  [string]$SshKey = $null,
  [string]$Package = 'tournament-deploy.tar.gz',
  [switch]$Force,
  [switch]$NoUpload,
  [switch]$InstallDeps
)

function Abort($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# Resolve script directory early so subsequent steps can use absolute paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Verify ssh/scp availability (unless NoUpload)
if (-not $NoUpload) {
  if (-not $Target) { Abort('Target is required unless -NoUpload is specified.') }
  $sshCmd = (Get-Command ssh -ErrorAction SilentlyContinue)
  $scpCmd = (Get-Command scp -ErrorAction SilentlyContinue)
  if (-not $sshCmd -or -not $scpCmd) {
    Abort("ssh and/or scp not found in PATH. Please install OpenSSH or run from a machine with ssh/scp.")
  }
}

 # Build frontend (use absolute path so script works from any CWD)
 Write-Host "Building frontend..."
 $clientDir = Join-Path $scriptDir 'tournament-app\client'
 if (-not (Test-Path $clientDir)) {
   Abort("Frontend folder not found at $clientDir. Ensure the repo layout is present and run again from the repository, or use -NoUpload to skip build.")
}
Write-Host "Building frontend at: $clientDir"
& npm --prefix "$clientDir" run build
if ($LASTEXITCODE -ne 0) { Abort('Frontend build failed. Fix build errors and re-run.') }

# Package
Write-Host "Packaging into $Package..."
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$packCmd = "$scriptDir\build_deploy_zip.ps1"
if (-not (Test-Path $packCmd)) { Abort("Package builder not found at $packCmd") }

# Run packer
# Ensure we run the packer from repo root
Push-Location $scriptDir
try {
  & powershell -ExecutionPolicy Bypass -File $packCmd -OutFile $Package -Force -BuildFrontend -CreateTarGz
  if ($LASTEXITCODE -ne 0) { Pop-Location; Abort("Packing failed with exit code $LASTEXITCODE") }
} catch {
  Pop-Location
  Abort("Packing failed: $_")
}
Pop-Location
if (-not (Test-Path $Package)) { Abort("Package $Package not created.") }


# If NoUpload: perform local staging instead of copying to remote
if ($NoUpload) {
    Write-Host "NoUpload specified: performing local staging instead of scp/ssh..."
    $stagingRoot = Join-Path $scriptDir 'deploy_staging'
    if (Test-Path $stagingRoot) { Remove-Item -Recurse -Force $stagingRoot }
    New-Item -Path $stagingRoot -ItemType Directory | Out-Null
    $tmpLocal = Join-Path $scriptDir 'deploy_tmp_local'
    if (Test-Path $tmpLocal) { Remove-Item -Recurse -Force $tmpLocal }
    New-Item -Path $tmpLocal -ItemType Directory | Out-Null

    # extract locally (tar.gz or zip)
    if ($Package.ToLower().EndsWith('.tar.gz')) {
        $tarCmd = (Get-Command tar -ErrorAction SilentlyContinue)
        if ($tarCmd) {
            & tar -xzf $Package -C $tmpLocal
        } else {
            Abort('tar not found locally to extract .tar.gz package; install tar or create a zip package instead.')
        }
    } elseif ($Package.ToLower().EndsWith('.zip')) {
        Expand-Archive -Path $Package -DestinationPath $tmpLocal
    } else {
        Abort('Unknown package format. Expected .tar.gz or .zip')
    }

    # copy www -> stagingRoot/www
    $srcWww = Join-Path $tmpLocal 'www'
    if (Test-Path $srcWww) {
        $destWww = Join-Path $stagingRoot 'www'
        New-Item -Path $destWww -ItemType Directory | Out-Null
        Copy-Item -Path (Join-Path $srcWww '*') -Destination $destWww -Recurse -Force
        Write-Host "Staged frontend to: $destWww"
    } else { Write-Host "No www folder in package; skipping frontend staging." }

    # copy backend -> stagingRoot/backend
    $srcBackend = Join-Path $tmpLocal 'backend'
    if (Test-Path $srcBackend) {
        $destBackend = Join-Path $stagingRoot 'backend'
        Copy-Item -Path $srcBackend -Destination $destBackend -Recurse -Force
        Write-Host "Staged backend to: $destBackend"
        if ($InstallDeps) {
            Write-Host "Installing backend deps in staging (this may take a while)..."
            Push-Location $destBackend
            try { npm ci --production } catch { npm install --production }
            Pop-Location
        } else {
            Write-Host "Skipping backend npm install in staging (pass -InstallDeps to run it)." 
        }
    } else { Write-Host "No backend folder in package; skipping backend staging." }

    # move nginx-site.conf if present
    $nginxConf = Join-Path $tmpLocal 'nginx-site.conf'
    if (Test-Path $nginxConf) {
        Copy-Item -Path $nginxConf -Destination (Join-Path $stagingRoot 'nginx-site.conf') -Force
        Write-Host "Staged nginx-site.conf to staging root"
    }

    # cleanup tmpLocal
    Remove-Item -Recurse -Force $tmpLocal
    Write-Host "Local staging complete at: $stagingRoot" -ForegroundColor Green

} else {
    # Copy package to remote /tmp
    $remoteTmp = "/tmp/$(Split-Path $Package -Leaf)"
    $scpArgs = @()
    if ($SshKey) { $scpArgs += "-i"; $scpArgs += $SshKey }
    $scpArgs += $Package
    $scpArgs += "${Target}:$remoteTmp"
  Write-Host "Transferring package to ${Target}:$remoteTmp..."
  & scp @scpArgs
  if ($LASTEXITCODE -ne 0) { Abort('scp failed') }

    # Remote commands: extract and move into place, restart nginx, start backend
    $remoteCmd = @"
set -e
TMPDIR=/tmp/deploy_tmp_$$
mkdir -p "$TMPDIR"
# extract package into tmp dir
sudo tar -xzf "$remoteTmp" -C "$TMPDIR"
# move frontend www to RemoteDir
sudo mkdir -p $RemoteDir
# prefer rsync if available to avoid partial copy issues
if command -v rsync >/dev/null 2>&1; then
  sudo rsync -a "$TMPDIR/www/" "$RemoteDir/"
else
  sudo cp -r "$TMPDIR/www/"* "$RemoteDir/"
fi
# move backend
sudo mkdir -p /opt/tournament
if [ -d "$TMPDIR/backend" ]; then
  sudo rm -rf /opt/tournament/backend
  sudo mv "$TMPDIR/backend" /opt/tournament/backend
fi
# install nginx site if present
if [ -f "$TMPDIR/nginx-site.conf" ]; then
  sudo mv -f "$TMPDIR/nginx-site.conf" /etc/nginx/sites-available/tournament.conf
  sudo ln -sf /etc/nginx/sites-available/tournament.conf /etc/nginx/sites-enabled/tournament.conf
  sudo systemctl restart nginx || sudo service nginx restart || true
fi
# adjust ownership
sudo chown -R www-data:www-data "$RemoteDir"
sudo chown -R www-data:www-data /opt/tournament/backend || true
# install backend deps and start with pm2
if [ -d /opt/tournament/backend ]; then
  cd /opt/tournament/backend
  # try to install dependencies; tolerate failures
  sudo -H bash -lc "npm ci --production || npm install --production || true"
  if command -v pm2 >/dev/null 2>&1; then
    sudo pm2 stop tournament-backend || true
    sudo pm2 start index.js --name tournament-backend --cwd /opt/tournament/backend || sudo pm2 start /opt/tournament/backend/index.js --name tournament-backend
    sudo pm2 save || true
  else
    # try to install pm2 and run
    sudo npm i -g pm2 || true
    sudo pm2 start index.js --name tournament-backend --cwd /opt/tournament/backend || true
    sudo pm2 save || true
  fi
fi
# cleanup
rm -f "$remoteTmp"
rm -rf "$TMPDIR"
echo "DEPLOY_OK"
"@

    # Execute remote
    $sshArgs = @()
    if ($SshKey) { $sshArgs += "-i"; $sshArgs += $SshKey }
    $sshArgs += $Target
    $sshArgs += $remoteCmd
  Write-Host "Running remote deploy steps on $Target..."
  & ssh @sshArgs
  if ($LASTEXITCODE -ne 0) { Abort('Remote deploy commands failed') }

}

Write-Host "Deployment complete. Frontend served from $RemoteDir on $Target" -ForegroundColor Green
