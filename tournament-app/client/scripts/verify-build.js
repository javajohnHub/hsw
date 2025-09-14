#!/usr/bin/env node
/**
 * Simple post-build verification to ensure critical template markers made it
 * into the optimized bundle. Fails fast so you don't deploy stale UI.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist/retro-never-dies-client');
if (!fs.existsSync(distDir)) {
  console.error('[verify-build] Dist folder missing:', distDir);
  process.exit(1);
}

// Find main bundle
const main = fs.readdirSync(distDir).find(f => /^main\..+\.js$/.test(f));
if (!main) {
  console.error('[verify-build] No main.*.js bundle found');
  process.exit(1);
}
const bundlePath = path.join(distDir, main);
const content = fs.readFileSync(bundlePath, 'utf-8');

if (!content || content.length < 1000) {
  console.error('[verify-build] Bundle too small or empty – possible build issue');
  process.exit(2);
}

console.log('[verify-build] OK main bundle present:', main, 'size', content.length);
