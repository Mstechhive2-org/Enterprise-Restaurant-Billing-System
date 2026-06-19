const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: "RestoPOS",
    show: false // Wait until ready to show
  });

  // Load the built static files
  mainWindow.loadFile(path.join(__dirname, 'frontend/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  const backendPath = path.join(__dirname, 'backend');
  
  // Start the backend Node server using the bundled folder
  backendProcess = spawn('npm', ['start'], {
    cwd: backendPath,
    shell: true,
    stdio: 'inherit'
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend server.', err);
    dialog.showErrorBox('Backend Error', 'Failed to start the local database server.');
  });
}

app.on('ready', () => {
  startBackend();
  // Wait a little bit for the backend to initialize
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Kill the backend process when the app closes
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
