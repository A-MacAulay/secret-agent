import { BrowserWindow, screen, Rectangle } from 'electron';
import Store from 'electron-store';

let popupWindow: BrowserWindow | null = null;

// Declare webpack magic variables
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 560;

interface WindowStateSchema {
  popupBounds?: Rectangle;
}

const windowStore = new Store<WindowStateSchema>({
  name: 'window-state',
  defaults: {},
});

function getStoredBounds(): Rectangle | null {
  const bounds = windowStore.get('popupBounds');
  if (!bounds) return null;
  if (
    typeof bounds.x !== 'number' ||
    typeof bounds.y !== 'number' ||
    typeof bounds.width !== 'number' ||
    typeof bounds.height !== 'number'
  ) {
    return null;
  }
  return bounds;
}

function clampBoundsToDisplay(bounds: Rectangle): Rectangle {
  const display = screen.getDisplayMatching(bounds);
  const workArea = display.workArea;

  const width = Math.max(320, Math.min(bounds.width, workArea.width));
  const height = Math.max(240, Math.min(bounds.height, workArea.height));

  const x = Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - width);
  const y = Math.min(Math.max(bounds.y, workArea.y), workArea.y + workArea.height - height);

  return { x, y, width, height };
}

let saveBoundsTimer: NodeJS.Timeout | null = null;
function scheduleSaveBounds(): void {
  if (!popupWindow || popupWindow.isDestroyed()) return;
  if (saveBoundsTimer) clearTimeout(saveBoundsTimer);
  saveBoundsTimer = setTimeout(() => {
    if (!popupWindow || popupWindow.isDestroyed()) return;
    windowStore.set('popupBounds', popupWindow.getBounds());
  }, 200);
}

export function createPopupWindow(): BrowserWindow {
  const stored = getStoredBounds();
  const initialBounds = stored
    ? clampBoundsToDisplay(stored)
    : clampBoundsToDisplay({
        x: screen.getPrimaryDisplay().workArea.x + screen.getPrimaryDisplay().workArea.width - DEFAULT_WIDTH - 20,
        y: screen.getPrimaryDisplay().workArea.y + screen.getPrimaryDisplay().workArea.height - DEFAULT_HEIGHT - 60,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
      });

  popupWindow = new BrowserWindow({
    x: initialBounds.x,
    y: initialBounds.y,
    width: initialBounds.width,
    height: initialBounds.height,
    show: false,
    frame: false,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: false,
    hasShadow: true,
    backgroundColor: '#0d1117',
    ...(process.platform === 'win32' ? { thickFrame: true } : {}),
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

  // Persist bounds as the user moves/resizes the PiP window.
  popupWindow.on('move', scheduleSaveBounds);
  popupWindow.on('resize', scheduleSaveBounds);

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

  // If invoked from tray click, nudge the window near the tray icon,
  // otherwise show it where the user last left it.
  if (trayBounds) {
    const position = calculateWindowPosition(trayBounds, popupWindow.getBounds());
    popupWindow.setPosition(position.x, position.y, false);
  }

  popupWindow.show();
  popupWindow.focus();
}

export function hidePopupWindow(): void {
  if (popupWindow && popupWindow.isVisible()) {
    popupWindow.hide();
  }
}

function calculateWindowPosition(trayBounds: Rectangle | undefined, currentBounds: Rectangle): { x: number; y: number } {
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;
  const width = currentBounds.width;
  const height = currentBounds.height;
  
  let x: number;
  let y: number;

  if (trayBounds) {
    // Position below/above the tray icon
    if (process.platform === 'darwin') {
      // macOS: menu bar is at top
      x = Math.round(trayBounds.x + trayBounds.width / 2 - width / 2);
      y = Math.round(trayBounds.y + trayBounds.height + 4);
    } else {
      // Windows: taskbar can be anywhere, but usually bottom
      const taskbarAtBottom = trayBounds.y > screenHeight / 2;
      
      x = Math.round(trayBounds.x + trayBounds.width / 2 - width / 2);
      
      if (taskbarAtBottom) {
        // Position above taskbar
        y = Math.round(trayBounds.y - height - 4);
      } else {
        // Position below taskbar
        y = Math.round(trayBounds.y + trayBounds.height + 4);
      }
    }
  } else {
    // Fallback: center of screen or top-right corner
    if (process.platform === 'darwin') {
      x = screenWidth - width - 20;
      y = 30;
    } else {
      x = screenWidth - width - 20;
      y = screenHeight - height - 60;
    }
  }

  // Ensure window stays within screen bounds
  x = Math.max(10, Math.min(x, screenWidth - width - 10));
  y = Math.max(10, Math.min(y, screenHeight - height - 10));

  return { x, y };
}

export function resetPopupWindowBounds(): void {
  if (!popupWindow || popupWindow.isDestroyed()) return;

  const display = screen.getPrimaryDisplay();
  const workArea = display.workArea;
  const bounds = clampBoundsToDisplay({
    x: workArea.x + workArea.width - DEFAULT_WIDTH - 20,
    y: workArea.y + workArea.height - DEFAULT_HEIGHT - 60,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  popupWindow.setBounds(bounds);
  windowStore.set('popupBounds', bounds);
}

export function focusOnProject(workspaceId: string): void {
  if (popupWindow) {
    popupWindow.webContents.send('focus-project', workspaceId);
    showPopupWindow();
  }
}

