module.exports = {
  apps: [
    {
      name: 'edwards-webdev',
      script: './server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        FRONTEND_URL: 'https://edwardswebdevelopment.com'
      },
      // PM2 will restart the app if it crashes
      autorestart: true,
      // Watch for file changes in development
      watch: false,
      // Max memory before restart (500MB)
      max_memory_restart: '500M',
      // Memory optimization
      node_args: '--max-old-space-size=512',
      // Error and output logs
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_file: './logs/app-combined.log',
      // Time format for logs
      time: true,
      // Ignore these files/folders from watch
      ignore_watch: ['node_modules', 'logs'],
      // Environment variables
      env_file: './backend/.env'
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: '165.227.185.255',
      ref: 'origin/main',
      repo: 'YOUR_GIT_REPO_URL',
      path: '/var/www/edwards-webdev',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};
