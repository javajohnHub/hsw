#!/bin/sh
# Start backend (basic)
cd /opt/tournament/backend || exit 1
# install deps (only if needed)
# npm ci
node index.js
