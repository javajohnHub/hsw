# Edwards Web Development - SSH Key Setup Guide

## Quick SSH Key Setup for Deployment

### Step 1: Generate SSH Key Pair (if you don't have one)

```bash
# Generate a new ED25519 SSH key (recommended)
ssh-keygen -t ed25519 -C "edwards-webdev-deployment"

# Or generate RSA key (fallback)
ssh-keygen -t rsa -b 4096 -C "edwards-webdev-deployment"
```

When prompted:
- **File location**: Press Enter for default (`~/.ssh/id_ed25519`)
- **Passphrase**: Optional, but recommended for security

### Step 2: Copy Public Key to Server

```bash
# Copy your public key to the server
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@165.227.185.255

# Or manually copy (if ssh-copy-id not available)
cat ~/.ssh/id_ed25519.pub | ssh root@165.227.185.255 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Step 3: Test SSH Connection

```bash
# Test the connection
ssh -i ~/.ssh/id_ed25519 root@165.227.185.255

# Should connect without asking for password
```

### Step 4: Deploy Edwards Web Development

```bash
# Now run the deployment
cd c:\Users\joedw\OneDrive\Desktop\mybizsite
npm run deploy:quick
```

## Alternative: Windows PowerShell Setup

```powershell
# Generate SSH key on Windows
ssh-keygen -t ed25519 -C "edwards-webdev-deployment"

# Copy public key content to clipboard
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard

# Manually add to server's authorized_keys file
ssh root@165.227.185.255
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key content and save
```

## Troubleshooting SSH Issues

### Permission Errors
```bash
# Fix SSH directory permissions on server
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/id_ed25519
```

### Connection Refused
```bash
# Check SSH service on server
sudo systemctl status ssh
sudo systemctl start ssh
sudo systemctl enable ssh
```

### Key Not Found
```bash
# List available SSH keys
ls -la ~/.ssh/

# Specify custom key path
export SSH_KEY_PATH="~/.ssh/your-custom-key"
npm run deploy
```

## Security Best Practices

1. **Use Ed25519 keys** (more secure than RSA)
2. **Add passphrase** to private key
3. **Regular key rotation** (every 6-12 months)
4. **Disable password authentication** on server
5. **Use SSH agent** for key management

```bash
# Start SSH agent and add key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

## Server SSH Configuration

Edit `/etc/ssh/sshd_config` on your server:

```bash
# Enable public key authentication
PubkeyAuthentication yes
AuthorizedKeysFile ~/.ssh/authorized_keys

# Disable password authentication (recommended)
PasswordAuthentication no
ChallengeResponseAuthentication no

# Restart SSH service
sudo systemctl restart ssh
```

---
**Edwards Web Development** - Secure deployment with SSH keys