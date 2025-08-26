# PowerShell Upload Script for RND Tournament Management
# Alternative to SCP using PowerShell and third-party tools

param(
    [string]$ServerIP = "165.227.185.255",
    [string]$Username = "root",
    [string]$ZipFile = "RND-Tournament-Management-Server.zip",
    [string]$RemotePath = "/home/deploy/"
)

Write-Host "🚀 PowerShell Upload to Server" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# Check if ZIP file exists
if (!(Test-Path $ZipFile)) {
    Write-Host "❌ Deployment package not found: $ZipFile" -ForegroundColor Red
    Write-Host "   Please run build-deployment.cmd first" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "📦 Found deployment package: $ZipFile" -ForegroundColor Green
Write-Host "🎯 Target server: $ServerIP" -ForegroundColor Cyan
Write-Host "👤 SSH user: $Username" -ForegroundColor Cyan
Write-Host "📁 Remote path: $RemotePath" -ForegroundColor Cyan
Write-Host ""

# Check for available SSH methods
$sshMethods = @()

# Method 1: Windows OpenSSH
if (Get-Command ssh -ErrorAction SilentlyContinue) {
    $sshMethods += @{Name="Windows OpenSSH"; Command="ssh"; SCP="scp"}
}

# Method 2: Git Bash
$gitPaths = @(
    "C:\Program Files\Git\usr\bin\ssh.exe",
    "C:\Program Files (x86)\Git\usr\bin\ssh.exe"
)

foreach ($gitPath in $gitPaths) {
    if (Test-Path $gitPath) {
        $gitDir = Split-Path $gitPath
        $sshMethods += @{Name="Git Bash SSH"; Command="`"$gitPath`""; SCP="`"$gitDir\scp.exe`""}
        break
    }
}

# Method 3: WSL
if (Get-Command wsl -ErrorAction SilentlyContinue) {
    $sshMethods += @{Name="WSL SSH"; Command="wsl ssh"; SCP="wsl scp"}
}

if ($sshMethods.Count -eq 0) {
    Write-Host "❌ No SSH client found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Please install one of the following:" -ForegroundColor Yellow
    Write-Host "   1. Git for Windows: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "   2. OpenSSH Client: Settings > Apps > Optional Features" -ForegroundColor White
    Write-Host "   3. Windows Subsystem for Linux (WSL)" -ForegroundColor White
    Write-Host ""
    Write-Host "📤 Or use a GUI tool:" -ForegroundColor Yellow
    Write-Host "   - WinSCP: https://winscp.net/" -ForegroundColor White
    Write-Host "   - FileZilla: https://filezilla-project.org/" -ForegroundColor White
    Write-Host ""
    
    $openBrowser = Read-Host "Open WinSCP download page? (y/n)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process "https://winscp.net/"
    }
    
    Read-Host "Press Enter to exit"
    exit 1
}

# Use the first available method
$method = $sshMethods[0]
Write-Host "✅ Using: $($method.Name)" -ForegroundColor Green

# Upload the file
Write-Host "📤 Uploading deployment package..." -ForegroundColor Yellow
$scpCommand = "$($method.SCP) `"$ZipFile`" $Username@$ServerIP`:$RemotePath"
Write-Host "Command: $scpCommand" -ForegroundColor Gray
Write-Host ""

try {
    Invoke-Expression $scpCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Upload completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Next steps on the server:" -ForegroundColor Cyan
        Write-Host "   1. SSH to server: $($method.Command) $Username@$ServerIP" -ForegroundColor White
        Write-Host "   2. Extract package: unzip $RemotePath$ZipFile" -ForegroundColor White
        Write-Host "   3. Deploy: chmod +x server-deploy.sh && ./server-deploy.sh" -ForegroundColor White
        Write-Host "   4. Access at: http://$ServerIP`:4000" -ForegroundColor White
        Write-Host ""
        
        $deployNow = Read-Host "Would you like to SSH and deploy now? (y/n)"
        if ($deployNow -eq "y" -or $deployNow -eq "Y") {
            Write-Host "🔗 Connecting to server..." -ForegroundColor Yellow
            Invoke-Expression "$($method.Command) $Username@$ServerIP"
        }
    } else {
        throw "SCP command failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   - Verify server IP: $ServerIP" -ForegroundColor White
    Write-Host "   - Check SSH access: $($method.Command) $Username@$ServerIP" -ForegroundColor White
    Write-Host "   - Ensure remote directory exists: $RemotePath" -ForegroundColor White
    Write-Host "   - Check network connectivity" -ForegroundColor White
}

Read-Host "Press Enter to exit"
