const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class EdwardsWebDevStarter {
  constructor() {
    this.backendPath = path.join(__dirname, '..', 'backend');
    this.frontendPath = path.join(__dirname, '..', 'frontend');
    this.backendPort = 3000; // Standard Express port
    this.frontendPort = 4200; // Standard Angular port
    this.processes = [];
  }

  async checkPrerequisites() {
    console.log('🔍 Checking Edwards Web Development prerequisites...\n');

    // Check if backend dist exists
    const backendDist = path.join(this.backendPath, 'dist', 'server.js');
    if (!fs.existsSync(backendDist)) {
      console.log('❌ Backend not built. Building now...');
      return this.buildBackend();
    }

    console.log('✅ Prerequisites check complete\n');
    return true;
  }

  async buildBackend() {
    return new Promise((resolve) => {
      console.log('🔧 Building Edwards Web Development backend...');
      
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: this.backendPath,
        stdio: 'inherit',
        shell: true
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Backend build completed\n');
          resolve(true);
        } else {
          console.error('❌ Backend build failed\n');
          resolve(false);
        }
      });
    });
  }

  async killPortProcesses() {
    console.log('🧹 Cleaning up existing processes...');
    
    for (const port of [this.backendPort, this.frontendPort]) {
      try {
        const { stdout } = await this.execAsync(`netstat -ano | findstr :${port}`);
        console.log(`🔄 Killing processes on port ${port}...`);
        
        const lines = stdout.split('\n');
        for (const line of lines) {
          const match = line.match(/\s+(\d+)\s*$/);
          if (match) {
            const pid = match[1];
            try {
              await this.execAsync(`taskkill /PID ${pid} /F`);
              console.log(`✅ Killed process ${pid} on port ${port}`);
            } catch (killError) {
              // Process might already be dead
            }
          }
        }
      } catch (error) {
        console.log(`✅ Port ${port} is available`);
      }
    }
    
    await this.sleep(2000);
  }

  async startBackend() {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Starting Edwards Web Development backend on port ${this.backendPort}...`);
      
      const backend = spawn('node', ['dist/server.js'], {
        cwd: this.backendPath,
        stdio: 'pipe',
        env: { 
          ...process.env, 
          NODE_ENV: 'development', 
          PORT: this.backendPort.toString() 
        }
      });

      this.processes.push({ name: 'backend', process: backend });

      let backendStarted = false;

      backend.stdout?.on('data', (data) => {
        const output = data.toString();
        process.stdout.write(`[Backend] ${output}`);
        
        if (output.includes('Edwards Web Development API server running') || 
            output.includes(`port ${this.backendPort}`)) {
          backendStarted = true;
        }
      });

      backend.stderr?.on('data', (data) => {
        const error = data.toString();
        process.stderr.write(`[Backend Error] ${error}`);
      });

      backend.on('error', (error) => {
        console.error('❌ Backend startup error:', error.message);
        reject(error);
      });

      const checkStarted = setInterval(async () => {
        if (backendStarted) {
          clearInterval(checkStarted);
          console.log(`✅ Backend started successfully on http://localhost:${this.backendPort}`);
          resolve();
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(checkStarted);
        if (!backendStarted) {
          reject(new Error('Backend startup timeout'));
        }
      }, 15000);
    });
  }

  async startFrontend() {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Starting Edwards Web Development frontend on port ${this.frontendPort}...`);
      
      const frontend = spawn('ng', [
        'serve', 
        '--host', '0.0.0.0', 
        '--port', this.frontendPort.toString(),
        '--disable-host-check'
      ], {
        cwd: this.frontendPath,
        stdio: 'pipe',
        shell: true
      });

      this.processes.push({ name: 'frontend', process: frontend });

      let frontendReady = false;

      frontend.stdout?.on('data', (data) => {
        const output = data.toString();
        process.stdout.write(`[Frontend] ${output}`);
        
        if (output.includes('compiled successfully') || 
            output.includes('Local:') || 
            output.includes('webpack compiled')) {
          frontendReady = true;
        }
      });

      frontend.stderr?.on('data', (data) => {
        const error = data.toString();
        process.stderr.write(`[Frontend Error] ${error}`);
      });

      const checkReady = setInterval(() => {
        if (frontendReady) {
          clearInterval(checkReady);
          console.log(`✅ Frontend started successfully on http://localhost:${this.frontendPort}`);
          resolve();
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(checkReady);
        if (!frontendReady) {
          console.log('⚠️  Frontend startup timeout - it may still be loading');
          resolve();
        }
      }, 45000);
    });
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

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setupCleanup() {
    const cleanup = () => {
      console.log('\n🛑 Shutting down Edwards Web Development...');
      
      this.processes.forEach(({ name, process }) => {
        if (!process.killed) {
          console.log(`Stopping ${name}...`);
          process.kill('SIGTERM');
        }
      });
      
      setTimeout(() => process.exit(0), 3000);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  async start() {
    console.log('🚀 Edwards Web Development Development Server\n');
    console.log('🖼️  Iframe-friendly configuration enabled\n');

    try {
      this.setupCleanup();

      const prereqsOk = await this.checkPrerequisites();
      if (!prereqsOk) {
        console.error('❌ Prerequisites check failed');
        process.exit(1);
      }

      await this.killPortProcesses();
      await this.startBackend();
      await this.sleep(2000);
      await this.startFrontend();

      console.log('\n🎉 Edwards Web Development is running successfully!\n');
      console.log('📊 Service Status:');
      console.log(`📱 Frontend: http://localhost:${this.frontendPort}`);
      console.log(`🔧 Backend API: http://localhost:${this.backendPort}`);
      console.log(`💚 Health Check: http://localhost:${this.backendPort}/health`);
      console.log(`🖼️  Iframe Test: http://localhost:${this.backendPort}/iframe-test`);
      console.log('\n🖼️  For iframe embedding:');
      console.log(`   <iframe src="http://localhost:4000" width="100%" height="600px"></iframe>`);
      console.log('\n👨‍💻 Professional web development services are ready!');
      console.log('\n📝 Press Ctrl+C to stop all services');

    } catch (error) {
      console.error('\n❌ Failed to start Edwards Web Development:', error.message);
      process.exit(1);
    }
  }
}

// Start the Edwards Web Development application
const starter = new EdwardsWebDevStarter();
starter.start().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});