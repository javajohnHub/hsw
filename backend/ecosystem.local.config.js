module.exports = {
  apps: [{
    name: 'edwards-webdev-api',
    script: './dist/server.js',
    cwd: process.cwd(),
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/edwards-webdev-api-error.log',
    out_file: './logs/edwards-webdev-api-out.log',
    log_file: './logs/edwards-webdev-api-combined.log'
  }]
};
