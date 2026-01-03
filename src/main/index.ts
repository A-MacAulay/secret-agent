import { app, BrowserWindow } from 'electron';
import { createTray, destroyTray } from './tray';
import { createPopupWindow, getPopupWindow, showPopupWindow } from './windows';
import { registerIPCHandlers } from './ipc-handlers';
import { initWorkspaceRegistry } from './services/workspace-registry';
import { initFileWatcher, stopAllWatchers } from './services/file-watcher';

// Handle Squirrel events for Windows installer
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window
    const popup = getPopupWindow();
    if (popup) {
      popup.show();
      popup.focus();
    }
  });
}

// Hide dock icon on macOS (we're a menu bar app)
if (process.platform === 'darwin') {
  app.dock?.hide();
}

app.whenReady().then(async () => {
  // Required on Windows for reliable toast notification behavior (including click-to-focus)
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.macaualay.secret-agent');
  }

  // Initialize services
  await initWorkspaceRegistry();
  
  // Register IPC handlers
  registerIPCHandlers();
  
  // Create the popup window (hidden initially)
  createPopupWindow();
  
  // Create tray icon
  createTray();

  // Show the floating window by default (PiP-style)
  showPopupWindow();
  
  // Start watching workspaces
  initFileWatcher();
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  // On macOS, keep the app running in the tray
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window if dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createPopupWindow();
  }
});

app.on('before-quit', () => {
  // Clean up watchers
  stopAllWatchers();
  destroyTray();
});

