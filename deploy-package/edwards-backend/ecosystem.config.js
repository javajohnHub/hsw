module.exports = {  
  apps: [  
    {  
      name: 'edwards-webdev-unified',  
      script: './dist/server.js',  
      instances: 1,  
      env: {  
        NODE_ENV: 'production',  
        PORT: 3000  
      }  
    }  
  ]  
}; 
