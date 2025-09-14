#!/usr/bin/env node
/** Simple deploy: copy tournament dist into backend/public/tournaments (fresh). */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const dist = path.resolve(__dirname, '../dist/retro-never-dies-client');
const target = path.resolve(__dirname, '../../../backend/public/tournaments');
// Also update packaged release if present
const packagedTarget = path.resolve(__dirname, '../../../dist-release/package/backend/public/tournaments');

if (!fs.existsSync(dist)) {
  console.error('[deploy-tournaments] Dist missing:', dist);
  process.exit(1);
}

function rimraf(p) { if (fs.existsSync(p)) fs.rmSync(p, {recursive:true, force:true}); }
function copyDir(src, dest){
  if(!fs.existsSync(dest)) fs.mkdirSync(dest, {recursive:true});
  for(const entry of fs.readdirSync(src)){
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.statSync(s);
    if(stat.isDirectory()) copyDir(s,d); else fs.copyFileSync(s,d);
  }
}

console.log('[deploy-tournaments] dist:', dist);
console.log('[deploy-tournaments] target:', target);
console.log('[deploy-tournaments] packagedTarget (if exists):', packagedTarget);

console.log('[deploy-tournaments] Clearing target');
rimraf(target);
console.log('[deploy-tournaments] Copying dist -> target');
copyDir(dist, target);

if (fs.existsSync(path.dirname(packagedTarget))) {
  console.log('[deploy-tournaments] Updating packaged target');
  rimraf(packagedTarget);
  copyDir(dist, packagedTarget);
}

// Write marker
fs.writeFileSync(path.join(target, 'DEPLOY_MARKER.txt'), new Date().toISOString());
console.log('[deploy-tournaments] Done');
