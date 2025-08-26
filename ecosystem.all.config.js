const path = require('path');
const fs = require('fs');

const apps = [];

// Backend (compiled output)
apps.push({
  name: 'edwards-webdev-backend',
  script: 'backend/dist/server.js',
  cwd: './',
  env: {
    NODE_ENV: 'production',
    PORT: 3000
  },
  env_production: {
    NODE_ENV: 'production',
    PORT: parseInt(process.env.PORT, 10) || 3000,
    FRONTEND_URL: process.env.FRONTEND_URL,
    IP_ADDRESS: process.env.IP_ADDRESS,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    IFRAME_USER: process.env.IFRAME_USER,
    IFRAME_PASS: process.env.IFRAME_PASS
  },
  instances: 1,
  exec_mode: 'fork',
  watch: false
});

// Tournament server (optional)
const tournamentPath = path.join(__dirname, 'tournament-app', 'server');
if (fs.existsSync(path.join(tournamentPath, 'index.js'))) {
  apps.push({
    name: 'retro-never-dies-server',
    script: 'index.js',
    cwd: tournamentPath,
    env: { NODE_ENV: 'production', PORT: 4000 },
    env_production: { NODE_ENV: 'production', PORT: parseInt(process.env.TOURNAMENT_PORT, 10) || 4000 },
    instances: 1,
    exec_mode: 'fork',
    watch: false
  });
} else {
  console.log('PM2: tournament-app/server/index.js not found; skipping tournament process.');
}

module.exports = { apps };