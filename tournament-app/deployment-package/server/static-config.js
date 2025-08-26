// Production server configuration for deployment
const path = require('path');
const fs = require('fs');

// Determine static path for production
let staticPath;
let indexPath;

// Environment variables for deployment
const STATIC_PATH = process.env.STATIC_PATH || '../client/dist';
const BUILD_FOLDER = process.env.BUILD_FOLDER || 'rnd-overlay-tournament-management';

// Try different possible locations for the built Angular app
const possiblePaths = [
  // PM2 deployment paths
  path.join(__dirname, STATIC_PATH, BUILD_FOLDER),
  path.join(__dirname, STATIC_PATH),
  path.join(__dirname, '../client/dist', BUILD_FOLDER),
  path.join(__dirname, '../client/dist'),
  // Electron paths (if needed)
  path.join(__dirname, '../app/dist', BUILD_FOLDER),
  path.join(__dirname, '../dist', BUILD_FOLDER),
  // Fallback paths
  path.join(process.cwd(), 'client/dist', BUILD_FOLDER),
  path.join(process.cwd(), 'client/dist')
];

console.log('Looking for Angular build in possible paths:');
for (const p of possiblePaths) {
  console.log(`  ${p} - ${fs.existsSync(p) ? 'EXISTS' : 'NOT FOUND'}`);
  if (!staticPath && fs.existsSync(p)) {
    staticPath = p;
    indexPath = path.join(p, 'index.html');
    break;
  }
}

if (!staticPath) {
  console.warn('⚠️  Angular build not found in any expected location!');
  console.warn('   Make sure to run "npm run build" in the client folder');
  staticPath = path.join(__dirname, '../client/dist');
  indexPath = path.join(staticPath, 'index.html');
}

console.log('📁 Static files path:', staticPath);
console.log('📄 Index file path:', indexPath);
console.log('✅ Static path exists:', fs.existsSync(staticPath));
console.log('✅ Index file exists:', fs.existsSync(indexPath));

module.exports = {
  staticPath,
  indexPath,
  isReady: fs.existsSync(staticPath) && fs.existsSync(indexPath)
};
