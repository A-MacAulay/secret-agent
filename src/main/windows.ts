import { BrowserWindow, screen, Rectangle } from 'electron';

let popupWindow: BrowserWindow | null = null;

// Declare webpack magic variables
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const POPUP_WIDTH = 480;
const POPUP_HEIGHT = 560;

export function createPopupWindow(): BrowserWindow {
  popupWindow = new BrowserWindow({
    width: POPUP_WIDTH,
    height: POPUP_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: false,
    hasShadow: true,
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    visualEffectState: 'active',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  popupWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Hide when clicking outside
  popupWindow.on('blur', () => {
    // Small delay to allow click handling
    setTimeout(() => {
      if (popupWindow && !popupWindow.webContents.isDevToolsOpened()) {
        hidePopupWindow();
      }
    }, 100);
  });

  // Prevent window from being closed, just hide it
  popupWindow.on('close', (event) => {
    event.preventDefault();
    hidePopupWindow();
  });

  return popupWindow;
}

export function getPopupWindow(): BrowserWindow | null {
  return popupWindow;
}

export function showPopupWindow(trayBounds?: Rectangle): void {
  if (!popupWindow) return;

  const position = calculateWindowPosition(trayBounds);
  popupWindow.setPosition(position.x, position.y, false);
  popupWindow.show();
  popupWindow.focus();
}

export function hidePopupWindow(): void {
  if (popupWindow && popupWindow.isVisible()) {
    popupWindow.hide();
  }
}

function calculateWindowPosition(trayBounds?: Rectangle): { x: number; y: number } {
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;
  
  let x: number;
  let y: number;

  if (trayBounds) {
    // Position below/above the tray icon
    if (process.platform === 'darwin') {
      // macOS: menu bar is at top
      x = Math.round(trayBounds.x + trayBounds.width / 2 - POPUP_WIDTH / 2);
      y = Math.round(trayBounds.y + trayBounds.height + 4);
    } else {
      // Windows: taskbar can be anywhere, but usually bottom
      const taskbarAtBottom = trayBounds.y > screenHeight / 2;
      
      x = Math.round(trayBounds.x + trayBounds.width / 2 - POPUP_WIDTH / 2);
      
      if (taskbarAtBottom) {
        // Position above taskbar
        y = Math.round(trayBounds.y - POPUP_HEIGHT - 4);
      } else {
        // Position below taskbar
        y = Math.round(trayBounds.y + trayBounds.height + 4);
      }
    }
  } else {
    // Fallback: center of screen or top-right corner
    if (process.platform === 'darwin') {
      x = screenWidth - POPUP_WIDTH - 20;
      y = 30;
    } else {
      x = screenWidth - POPUP_WIDTH - 20;
      y = screenHeight - POPUP_HEIGHT - 60;
    }
  }

  // Ensure window stays within screen bounds
  x = Math.max(10, Math.min(x, screenWidth - POPUP_WIDTH - 10));
  y = Math.max(10, Math.min(y, screenHeight - POPUP_HEIGHT - 10));

  return { x, y };
}

export function focusOnProject(workspaceId: string): void {
  if (popupWindow) {
    popupWindow.webContents.send('focus-project', workspaceId);
    showPopupWindow();
  }
}

