module.exports = {
  apps: [{
    name: 'edwards-webdev-api',
    script: '/opt/edw/backend/dist/server.js',
    cwd: '/opt/edw/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/root/.pm2/logs/edwards-webdev-api-error.log',
    out_file: '/root/.pm2/logs/edwards-webdev-api-out.log',
    log_file: '/root/.pm2/logs/edwards-webdev-api-combined.log'
  }]
};
