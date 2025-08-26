#!/bin/bash
# deploy.sh <package-file> <user@host> [remote-dir]
PKG="$1"
TARGET="$2"
REMOTE_DIR="${3:-/opt/tournament}"
if [ -z "$PKG" ] || [ -z "$TARGET" ]; then
  echo "Usage: deploy.sh <package-file> <user@host> [remote-dir]"
  exit 1
fi

set -e
scp "$PKG" "$TARGET:/tmp/$(basename "$PKG")"
ssh "$TARGET" "mkdir -p $REMOTE_DIR && sudo tar -xzf /tmp/$(basename "$PKG") -C $REMOTE_DIR && sudo chown -R www-data:www-data $REMOTE_DIR && rm /tmp/$(basename "$PKG")"

echo "Deployed $PKG to $TARGET:$REMOTE_DIR"
