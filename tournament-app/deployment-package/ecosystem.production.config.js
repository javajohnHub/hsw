module.exports = {
  apps: [
    {
      name: 'rnd-tournament-backend',
      script: './server/index.js',
      cwd: '.',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        STATIC_PATH: './client/dist',
        BUILD_FOLDER: 'retro-never-dies-client'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
        STATIC_PATH: './client/dist',
        BUILD_FOLDER: 'retro-never-dies-client'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
