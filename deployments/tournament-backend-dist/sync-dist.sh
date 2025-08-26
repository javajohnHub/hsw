#!/bin/sh
SRC="../../tournament-app/client/dist/retro-never-dies-client"
DEST="client/dist/retro-never-dies-client"
if [ ! -d "$SRC" ]; then
  echo "Source dist not found: $SRC"
  exit 1
fi
mkdir -p "$DEST"
cp -r "$SRC"/* "$DEST"/
echo "Copied tournament client dist to $DEST"
