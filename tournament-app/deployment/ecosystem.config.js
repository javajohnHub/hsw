module.exports = {
  apps: [
    {
      name: 'rnd-tournament-backend',
      script: './server/index.js',
      cwd: './server',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'rnd-tournament-frontend',
      script: 'npm',
      args: 'run start:ui:fast',
      cwd: './client',
      env: {
        NODE_ENV: 'development'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
