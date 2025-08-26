const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Edwards Web Development - Quick Start\n');

const backendPath = path.join(__dirname, 'backend');
const frontendPath = path.join(__dirname, 'frontend');

// Start backend on port 3000
console.log('Starting Edwards Web Development backend on port 3000...');
const backend = spawn('node', ['dist/server.js'], {
  cwd: backendPath,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development', PORT: '3000' }
});

// Start frontend on port 4200 after a delay
setTimeout(() => {
  console.log('Starting Edwards Web Development frontend on port 4200...');
  const frontend = spawn('ng', ['serve', '--host', '0.0.0.0', '--port', '4200'], {
    cwd: frontendPath,
    stdio: 'inherit',
    shell: true
  });

  frontend.on('close', (code) => {
    console.log(`Frontend exited with code ${code}`);
  });
}, 3000);

backend.on('close', (code) => {
  console.log(`Backend exited with code ${code}`);
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Edwards Web Development...');
  backend.kill();
  process.exit();
});

console.log('\n📊 Edwards Web Development Services:');
console.log('📱 Frontend: http://localhost:4200');
console.log('🔧 Backend API: http://localhost:3000');
console.log('💚 Health: http://localhost:3000/health');
console.log('🖼️  Iframe Test: http://localhost:3000/iframe-test');
console.log('\nPress Ctrl+C to stop all services');