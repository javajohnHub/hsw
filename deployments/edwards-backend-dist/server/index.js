// Wrapper server for edwards-backend-dist
const path = require('path');
const fs = require('fs');

const candidates = [
  path.join(__dirname, '../../server/index.js'),
  path.join(__dirname, '../../server.js'),
  path.join(__dirname, '../../basic-server.js')
];

const found = candidates.find(p => fs.existsSync(p));
if (found) {
  console.log('Using existing edwards server at:', found);
  require(found);
} else {
  const express = require('express');
  const app = express();
  const staticPath = path.join(__dirname, '../frontend/dist');
  console.log('No existing edwards server found; serving static files from', staticPath);
  app.use(express.static(staticPath));
  app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log('Edwards dist fallback server listening on', port));
}
