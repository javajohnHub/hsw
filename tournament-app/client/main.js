const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    icon: path.join(__dirname, 'src/assets/icon.png'),
    title: 'RND Tournament Management'
  });

  // Always load from static files
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const distPath = isDev 
    ? path.join(__dirname, 'dist/retro-never-dies-client/index.html')
    : path.join(__dirname, 'dist/retro-never-dies-client/index.html');
    
  mainWindow.loadFile(distPath);
  
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Set Content Security Policy for static files
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:4000; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data:; " +
          "connect-src 'self' http://localhost:4000; " +
          "font-src 'self' data:;"
        ]
      }
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const serverPath = isDev 
    ? path.join(__dirname, '../server/index.js')
    : path.join(process.resourcesPath, 'server/index.js');
    
  serverProcess = spawn('node', [serverPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ELECTRON_APP: 'true' }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });
}

app.whenReady().then(() => {
  startServer();
  
  // Give server a moment to start
  setTimeout(() => {
    createWindow();
    
    // Add error handling for loading failures
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.log('Failed to load:', errorDescription, validatedURL);
      // Try to reload after a short delay
      setTimeout(() => {
        mainWindow.reload();
      }, 2000);
    });
    
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page loaded successfully');
    });
    
  }, 1000); // Reduced wait time since no Angular dev server needed

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
