const { exec, spawn } = require('child_process');
const path = require('path');

class LocalhostFixer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.backendPath = path.join(this.projectRoot, 'backend');
    this.frontendPath = path.join(this.projectRoot, 'frontend');
    this.frontendPort = 4200; // Standard Angular port for Edwards Web Development
    this.backendPort = 3000;  // Standard Express port for Edwards Web Development API
  }

  async killProcessOnPort(port) {
    return new Promise((resolve) => {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.split('\n');
          const killPromises = [];
          
          lines.forEach(line => {
            const match = line.match(/\s+(\d+)\s*$/);
            if (match) {
              const pid = match[1];
              killPromises.push(
                new Promise((killResolve) => {
                  exec(`taskkill /PID ${pid} /F`, (killError) => {
                    if (!killError) {
                      console.log(`✅ Killed process ${pid} on port ${port}`);
                    }
                    killResolve();
                  });
                })
              );
            }
          });
          
          Promise.all(killPromises).then(() => {
            console.log(`🧹 Port ${port} cleaned up`);
            resolve();
          });
        } else {
          console.log(`✅ Port ${port} is available`);
          resolve();
        }
      });
    });
  }

  async stopPM2() {
    return new Promise((resolve) => {
      exec('pm2 stop all && pm2 delete all', (error) => {
        if (!error) {
          console.log('✅ Stopped all PM2 processes');
        } else {
          console.log('ℹ️  No PM2 processes to stop');
        }
        resolve();
      });
    });
  }

  async buildBackend() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Building Edwards Web Development backend...');
      
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: this.backendPath,
        stdio: 'inherit',
        shell: true
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Backend build completed');
          resolve();
        } else {
          console.error('❌ Backend build failed');
          reject(new Error('Backend build failed'));
        }
      });

      buildProcess.on('error', (error) => {
        console.error('❌ Backend build error:', error.message);
        reject(error);
      });
    });
  }

  async startBackend() {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Starting Edwards Web Development backend on port ${this.backendPort}...`);
      
      const backendProcess = spawn('node', ['dist/server.js'], {
        cwd: this.backendPath,
        stdio: 'pipe',
        env: { 
          ...process.env, 
          NODE_ENV: 'development', 
          PORT: this.backendPort.toString() 
        }
      });

      let backendStarted = false;
      let startupOutput = '';

      // Monitor backend output
      backendProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        startupOutput += output;
        process.stdout.write(`[Backend] ${output}`);
        
        if (output.includes('Edwards Web Development API server running') || 
            output.includes(`port ${this.backendPort}`) ||
            output.includes('server running')) {
          backendStarted = true;
        }
      });

      backendProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        process.stderr.write(`[Backend Error] ${error}`);
        
        if (error.includes('EADDRINUSE')) {
          reject(new Error(`Port ${this.backendPort} is already in use`));
        }
      });

      backendProcess.on('error', (error) => {
        console.error('❌ Backend startup error:', error.message);
        reject(error);
      });

      backendProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
          console.log(`⚠️  Backend process exited with code ${code}`);
        }
      });

      // Check for successful startup
      const startupTimer = setInterval(() => {
        if (backendStarted) {
          clearInterval(startupTimer);
          console.log(`✅ Backend started successfully on http://localhost:${this.backendPort}`);
          console.log(`🖼️  Iframe test: http://localhost:${this.backendPort}/iframe-test`);
          resolve(backendProcess);
        }
      }, 1000);

      // Timeout after 20 seconds
      setTimeout(() => {
        clearInterval(startupTimer);
        if (!backendStarted) {
          console.log('⚠️  Backend startup timeout, but continuing...');
          console.log('📋 Backend output so far:', startupOutput);
          resolve(backendProcess); // Continue anyway
        }
      }, 20000);
    });
  }

  async startFrontend() {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Starting Edwards Web Development frontend on port ${this.frontendPort}...`);
      
      const frontendProcess = spawn('ng', [
        'serve', 
        '--host', '0.0.0.0', 
        '--port', this.frontendPort.toString(),
        '--disable-host-check',
        '--live-reload=false'
      ], {
        cwd: this.frontendPath,
        stdio: 'pipe',
        shell: true
      });

      let frontendReady = false;
      let frontendOutput = '';

      frontendProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        frontendOutput += output;
        process.stdout.write(`[Frontend] ${output}`);
        
        if (output.includes('compiled successfully') || 
            output.includes('Local:') || 
            output.includes('webpack compiled') ||
            output.includes('Application bundle generation complete') ||
            output.includes(`http://localhost:${this.frontendPort}`)) {
          frontendReady = true;
        }
      });

      frontendProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        
        // Don't show webpack warnings as errors
        if (!error.includes('Warning:') && !error.includes('WARNING in')) {
          process.stderr.write(`[Frontend Error] ${error}`);
        }
        
        if (error.includes('Port') && error.includes('is already in use')) {
          reject(new Error(`Port ${this.frontendPort} is already in use`));
        }
      });

      frontendProcess.on('error', (error) => {
        console.error('❌ Frontend startup error:', error.message);
        reject(error);
      });

      frontendProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
          console.log(`⚠️  Frontend process exited with code ${code}`);
        }
      });

      // Check for ready state
      const readyTimer = setInterval(() => {
        if (frontendReady) {
          clearInterval(readyTimer);
          console.log(`✅ Frontend started successfully on http://localhost:${this.frontendPort}`);
          resolve(frontendProcess);
        }
      }, 2000);

      // Extended timeout for Angular compilation
      setTimeout(() => {
        clearInterval(readyTimer);
        if (!frontendReady) {
          console.log('⚠️  Frontend startup timeout - Angular may still be compiling');
          console.log('📋 Frontend output so far:', frontendOutput);
          resolve(frontendProcess); // Continue anyway
        }
      }, 60000); // 60 seconds for Angular
    });
  }

  async checkHealth() {
    return new Promise((resolve) => {
      // Use Node.js http module for better reliability
      const http = require('http');
      
      const req = http.get(`http://localhost:${this.backendPort}/health`, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            if (health.status === 'healthy') {
              console.log('✅ Edwards Web Development backend health check passed');
              if (health.iframeSupport === 'enabled') {
                console.log('🖼️  Iframe support confirmed');
              }
              resolve(true);
            } else {
              console.log('⚠️  Backend health check returned non-healthy status');
              resolve(false);
            }
          } catch (parseError) {
            console.log('⚠️  Backend responded but health data invalid');
            resolve(res.statusCode === 200);
          }
        });
      });
      
      req.on('error', (error) => {
        console.log('⚠️  Backend health check failed:', error.message);
        resolve(false);
      });
      
      req.setTimeout(8000, () => {
        req.destroy();
        console.log('⚠️  Backend health check timeout');
        resolve(false);
      });
    });
  }

  async validatePorts() {
    console.log('🔍 Validating Edwards Web Development port configuration...');
    
    // Check if required ports are available
    for (const port of [this.backendPort, this.frontendPort]) {
      try {
        const { stdout } = await this.execAsync(`netstat -ano | findstr :${port}`);
        if (stdout.trim()) {
          console.log(`⚠️  Port ${port} is currently in use - will clean up`);
        } else {
          console.log(`✅ Port ${port} is available`);
        }
      } catch (error) {
        console.log(`✅ Port ${port} is available`);
      }
    }
  }

  async execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  async start() {
    console.log('🚀 Edwards Web Development Localhost Fixer\n');
    console.log('🖼️  Iframe-friendly configuration enabled\n');
    console.log(`📊 Port Configuration:`);
    console.log(`   Backend API: ${this.backendPort}`);
    console.log(`   Frontend: ${this.frontendPort}\n`);
    
    try {
      // Step 1: Validate ports
      await this.validatePorts();
      
      // Step 2: Clean up existing processes
      console.log('🧹 Cleaning up existing processes...');
      await this.stopPM2();
      await this.killProcessOnPort(this.backendPort);
      await this.killProcessOnPort(this.frontendPort);
      
      // Wait for ports to be fully freed
      console.log('⏳ Waiting for ports to be freed...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 3: Build backend
      await this.buildBackend();
      
      // Step 4: Start backend
      const backendProcess = await this.startBackend();
      
      // Step 5: Health check backend
      console.log('🏥 Performing backend health check...');
      setTimeout(async () => {
        const healthCheck = await this.checkHealth();
        
        if (healthCheck) {
          console.log('✅ Backend is healthy, starting frontend...');
        } else {
          console.log('⚠️  Backend health check failed, but continuing with frontend startup...');
        }
        
        // Step 6: Start frontend
        try {
          await this.startFrontend();
          
          console.log('\n🎉 Edwards Web Development is running successfully!');
          console.log('\n📊 Service Status:');
          console.log(`📱 Frontend: http://localhost:${this.frontendPort}`);
          console.log(`🔧 Backend API: http://localhost:${this.backendPort}`);
          console.log(`💚 Health Check: http://localhost:${this.backendPort}/health`);
          console.log(`🖼️  Iframe Test: http://localhost:${this.backendPort}/iframe-test`);
          console.log('\n🖼️  For iframe embedding, use:');
          console.log(`   <iframe src="http://localhost:4000" width="100%" height="600px"></iframe>`);
          console.log('\n👨‍💻 Professional web development services are ready!');
          console.log('\n📝 Press Ctrl+C to stop all services');
          
        } catch (frontendError) {
          console.error('❌ Frontend failed to start:', frontendError.message);
          console.log(`ℹ️  Backend is still running on http://localhost:${this.backendPort}`);
          console.log('🔧 You can access the API directly for testing');
        }
      }, 6000);

      // Handle cleanup on exit
      const cleanup = () => {
        console.log('\n🛑 Shutting down Edwards Web Development...');
        if (backendProcess && !backendProcess.killed) {
          backendProcess.kill('SIGTERM');
          setTimeout(() => {
            if (!backendProcess.killed) {
              backendProcess.kill('SIGKILL');
            }
          }, 5000);
        }
        process.exit(0);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      process.on('SIGBREAK', cleanup); // Windows specific

    } catch (error) {
      console.error('❌ Failed to start Edwards Web Development:', error.message);
      console.log('\n🔍 Troubleshooting steps:');
      console.log('1. Ensure Node.js and npm are installed');
      console.log('2. Run "npm install" in both frontend and backend directories');
      console.log(`3. Check if ports ${this.backendPort} and ${this.frontendPort} are available`);
      console.log('4. Verify Angular CLI is installed: npm list @angular/cli');
      console.log('5. Try manual startup:');
      console.log(`   Backend: cd backend && npm run build && node dist/server.js`);
      console.log(`   Frontend: cd frontend && ng serve --port ${this.frontendPort}`);
      process.exit(1);
    }
  }
}

const fixer = new LocalhostFixer();
fixer.start();