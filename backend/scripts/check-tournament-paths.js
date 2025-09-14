#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const paths = [
  path.resolve(__dirname, '../public/tournaments'),
  path.resolve(__dirname, '../../dist-release/package/backend/public/tournaments')
];
for (const p of paths) {
  const exists = fs.existsSync(p);
  console.log('\n[PATH]', p, exists ? 'EXISTS' : 'MISSING');
  if (!exists) continue;
  const files = fs.readdirSync(p).filter(f=>/^main\..+\.js$/.test(f));
  console.log(' main bundles:', files);
  if (files[0]) {
    const sample = path.join(p, files[0]);
    const size = fs.statSync(sample).size;
    console.log(' first bundle size:', size);
  }
}
