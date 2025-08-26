Tournament backend dist
======================

Contents:
- server/ - copy of `tournament-app/server` (index.js)
- client/ - copy of built `tournament-app/client/dist/retro-never-dies-client`

Run steps:

1. npm ci
2. npm start

Notes:
- Ensure the server `index.js` is configured to serve static files from `../client/dist` or adjust paths accordingly.
