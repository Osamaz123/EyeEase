const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;
let alertWindow = null;
let alertTimeout = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Added for ipc communication
    },
  });
  mainWindow.loadFile('index.html');

  // Remove the default menu bar
  mainWindow.setMenuBarVisibility(false);
}

function createAlertWindow() {
  alertWindow = new BrowserWindow({
    width: 320,
    height: 220,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Added for ipc communication
    },
  });
  alertWindow.loadFile('alert.html');

  const closeAlertTimeout = setTimeout(() => {
    if (alertWindow && !alertWindow.isDestroyed()) {
      alertWindow.close();
      alertWindow = null;
    }
  }, 20000); // 20 seconds

  alertWindow.on('closed', () => {
    clearTimeout(closeAlertTimeout);
    alertWindow = null;
    startAlertInterval();

    // Send message to mainWindow to reset the timer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('reset-timer');
    }
  });
}

function startAlertInterval() {
  alertTimeout = setTimeout(() => {
    if (!alertWindow) {
      createAlertWindow();
    }
  }, 20 * 60 * 1000); // 20 minutes in milliseconds
}

app.on('ready', () => {
  createWindow();
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Quit', click: () => { app.quit(); } },
  ]);
  tray.setToolTip('EyeEase');
  tray.setContextMenu(contextMenu);

  startAlertInterval();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
