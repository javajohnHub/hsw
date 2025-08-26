edwards-backend-dist
=====================

Contents:
- server/ - copy of the backend server files (index.js)
- frontend/ - copy of the built frontend `dist` directory

Run:

1. npm ci
2. npm start

Notes:
- This dist expects `server/index.js` to serve static files from `../frontend/dist` or similar. If not, replace `server/index.js` with your production server entry.
