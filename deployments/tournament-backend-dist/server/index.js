// Wrapper server for tournament-backend-dist
const path = require('path');
const fs = require('fs');

const localServer = path.join(__dirname, '../../tournament-app/server/index.js');
if (fs.existsSync(localServer)) {
  console.log('Using existing server at:', localServer);
  require(localServer);
} else {
  // Minimal pure-Node static server fallback (no external deps)
  const http = require('http');
  const fs = require('fs');
  const url = require('url');
  const staticPath = path.join(__dirname, '../client/dist/retro-never-dies-client');
  console.log('No external server found; serving static files from', staticPath);

  const mime = (p) => {
    if (p.endsWith('.html')) return 'text/html; charset=utf-8';
    if (p.endsWith('.js')) return 'application/javascript; charset=utf-8';
    if (p.endsWith('.css')) return 'text/css; charset=utf-8';
    if (p.endsWith('.json')) return 'application/json; charset=utf-8';
    if (p.endsWith('.png')) return 'image/png';
    if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
    if (p.endsWith('.webp')) return 'image/webp';
    if (p.endsWith('.svg')) return 'image/svg+xml';
    if (p.endsWith('.ico')) return 'image/x-icon';
    return 'application/octet-stream';
  };

  const server = http.createServer((req, res) => {
    try {
      const parsed = url.parse(req.url || '/');
      let pathname = decodeURIComponent(parsed.pathname || '/');
      // If a /data request, serve from the package data folder if present
      if (pathname.startsWith('/data')) {
        const dataPath = path.join(__dirname, '../data', pathname.replace('/data', ''));
        if (!dataPath.startsWith(path.join(__dirname, '../data'))) {
          res.writeHead(403);
          return res.end('Forbidden');
        }
        fs.stat(dataPath, (de, ds) => {
          if (de || !ds.isFile()) {
            res.writeHead(404);
            return res.end('Not found');
          }
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          fs.createReadStream(dataPath).pipe(res);
        });
        return;
      }
      if (pathname === '/') pathname = '/index.html';
      const filePath = path.join(staticPath, pathname);
      if (!filePath.startsWith(staticPath)) {
        res.writeHead(403);
        return res.end('Forbidden');
      }
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          // fallback to index.html for SPA routes
          const indexFile = path.join(staticPath, 'index.html');
          fs.readFile(indexFile, (ie, data) => {
            if (ie) {
              res.writeHead(500);
              return res.end('Server error');
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
          });
          return;
        }
        const stream = fs.createReadStream(filePath);
        res.writeHead(200, { 'Content-Type': mime(filePath) });
        stream.pipe(res);
      });
    } catch (e) {
      res.writeHead(500);
      res.end('Server error');
    }
  });

  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log('Tournament dist fallback server listening on', port));
}
