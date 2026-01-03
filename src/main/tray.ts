import { Tray, Menu, nativeImage, dialog, app, NativeImage } from 'electron';
import * as path from 'path';
import { showPopupWindow, hidePopupWindow, getPopupWindow, resetPopupWindowBounds } from './windows';
import { addWorkspace } from './services/workspace-registry';

let tray: Tray | null = null;
let hasAttention = false;

// Create a circular spy icon programmatically
function createProgrammaticIcon(size: number, attention: boolean): NativeImage {
  // Create raw RGBA pixel data
  const data = Buffer.alloc(size * size * 4);
  
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2 - 1;
  const innerRadius = size / 4;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      // Create a ring/donut shape (spy eye)
      if (dist <= outerRadius && dist >= innerRadius) {
        if (attention) {
          // Yellow/orange for attention
          data[idx] = 255;     // R
          data[idx + 1] = 180; // G
          data[idx + 2] = 0;   // B
        } else {
          // Gray for normal (works well as template on macOS)
          data[idx] = 100;     // R
          data[idx + 1] = 100; // G
          data[idx + 2] = 100; // B
        }
        data[idx + 3] = 255;   // A (opaque)
      } else if (dist < innerRadius) {
        // Inner dot (pupil)
        if (attention) {
          data[idx] = 255;
          data[idx + 1] = 100;
          data[idx + 2] = 0;
        } else {
          data[idx] = 60;
          data[idx + 1] = 60;
          data[idx + 2] = 60;
        }
        data[idx + 3] = 255;
      } else {
        // Transparent
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      }
    }
  }
  
  return nativeImage.createFromBuffer(data, { width: size, height: size });
}

function getTrayIcon(): NativeImage {
  // Use template images on macOS for proper dark/light mode support
  const iconName = process.platform === 'darwin' ? 'iconTemplate.png' : 'icon.png';
  
  // In development, look in assets folder
  // In production, look in resources
  const isDev = !app.isPackaged;
  const iconPath = isDev
    ? path.join(__dirname, '../../assets', iconName)
    : path.join(process.resourcesPath, 'assets', iconName);
  
  let icon = nativeImage.createFromPath(iconPath);
  
  // If icon doesn't exist, create programmatically
  if (icon.isEmpty()) {
    const size = process.platform === 'darwin' ? 22 : 16;
    icon = createProgrammaticIcon(size, hasAttention);
  }
  
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true);
  }
  
  return icon;
}

export function createTray(): void {
  const icon = getTrayIcon();
  tray = new Tray(icon);
  
  tray.setToolTip('Secret Agent');
  
  // Left click toggles popup
  tray.on('click', (_event, bounds) => {
    const popup = getPopupWindow();
    if (!popup) return;
    
    if (popup.isVisible()) {
      hidePopupWindow();
    } else {
      showPopupWindow(bounds);
    }
  });
  
  // Right click shows context menu
  tray.on('right-click', () => {
    const contextMenu = createContextMenu();
    tray?.popUpContextMenu(contextMenu);
  });
}

function createContextMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: 'Add Workspace...',
      click: async () => {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory'],
          title: 'Select Cursor Workspace',
          buttonLabel: 'Add Workspace',
        });
        
        if (!result.canceled && result.filePaths.length > 0) {
          await addWorkspace(result.filePaths[0]);
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Toggle Floating Window',
      click: () => {
        const popup = getPopupWindow();
        if (!popup) return;
        if (popup.isVisible()) hidePopupWindow();
        else showPopupWindow();
      },
    },
    {
      label: 'Reset Floating Window Position',
      click: () => {
        resetPopupWindowBounds();
        showPopupWindow();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Secret Agent',
      click: () => {
        app.quit();
      },
    },
  ]);
}

export function setTrayAttention(attention: boolean): void {
  hasAttention = attention;
  if (tray) {
    const icon = getTrayIcon();
    tray.setImage(icon);
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

export function getTray(): Tray | null {
  return tray;
}

