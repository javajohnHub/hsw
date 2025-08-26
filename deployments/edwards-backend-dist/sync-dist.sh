#!/bin/sh
SRC_FRONTEND="../../frontend/dist"
DEST_FRONTEND="frontend/dist"
if [ ! -d "$SRC_FRONTEND" ]; then
  echo "Source frontend dist not found: $SRC_FRONTEND"
  exit 1
fi
mkdir -p "$DEST_FRONTEND"
cp -r "$SRC_FRONTEND"/* "$DEST_FRONTEND"/
echo "Copied edwards frontend dist to $DEST_FRONTEND"
if [ -d "../../server" ]; then
  mkdir -p server
  cp -r ../../server/* server/
  echo "Copied server files into package/server"
fi
