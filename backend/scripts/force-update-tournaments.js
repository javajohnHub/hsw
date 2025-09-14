#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const src = path.resolve(__dirname, '../../tournament-app/client/dist/retro-never-dies-client');
const dest = path.resolve(__dirname, '../public/tournaments');
console.log('[force-update] SRC path:', src);
console.log('[force-update] DEST path:', dest);
if(!fs.existsSync(src)) { console.error('[force-update] SRC missing', src); process.exit(1);} 
function rimraf(p){ if(fs.existsSync(p)) { console.log('[force-update] rimraf', p); fs.rmSync(p,{recursive:true,force:true}); } }
function copyDir(s,d){ if(!fs.existsSync(d)) { console.log('[force-update] mkdir', d); fs.mkdirSync(d,{recursive:true}); } for(const e of fs.readdirSync(s)){const sp=path.join(s,e); const dp=path.join(d,e); const st=fs.statSync(sp); if(st.isDirectory()) { copyDir(sp,dp); } else { fs.copyFileSync(sp,dp); console.log('[force-update] file', e); } } }
console.log('[force-update] Removing dest'); rimraf(dest);
console.log('[force-update] Copying files...'); copyDir(src,dest);
fs.writeFileSync(path.join(dest,'FORCE_UPDATE_LOG.txt'), new Date().toISOString());
console.log('[force-update] Done');
