import { ipcMain, dialog, shell } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import { 
  getWorkspaces, 
  getWorkspace, 
  addWorkspace, 
  removeWorkspace,
  getWorkspaceConfig,
} from './services/workspace-registry';
import { writeUserResponse, extractQuestionId } from './services/contract-parser';
import { clearAttention } from './services/notification';

export function registerIPCHandlers(): void {
  // Get all workspaces
  ipcMain.handle('get-workspaces', async () => {
    return getWorkspaces();
  });

  // Add a workspace by path
  ipcMain.handle('add-workspace', async (_event, rootPath: string) => {
    return await addWorkspace(rootPath);
  });

  // Remove a workspace
  ipcMain.handle('remove-workspace', async (_event, workspaceId: string) => {
    return removeWorkspace(workspaceId);
  });

  // Get specific project state
  ipcMain.handle('get-project-state', async (_event, workspaceId: string) => {
    return getWorkspace(workspaceId);
  });

  // Submit user response
  ipcMain.handle('submit-response', async (_event, workspaceId: string, questionId: string, response: string) => {
    const workspace = getWorkspace(workspaceId);
    if (!workspace) {
      return false;
    }

    const companionDir = path.join(workspace.config.rootPath, '.cursor_companion');
    const projectName = workspace.project?.projectName || workspace.config.displayName;
    
    // If no questionId provided, try to extract from current question
    const qId = questionId || extractQuestionId(workspace.question);
    
    return await writeUserResponse(companionDir, projectName, qId, response);
  });

  // Open folder in file manager
  ipcMain.handle('open-folder', async (_event, rootPath: string) => {
    shell.openPath(rootPath);
  });

  // Open in Cursor
  ipcMain.handle('open-in-cursor', async (_event, rootPath: string) => {
    // Try to open with Cursor CLI
    const cursorCmd = process.platform === 'win32' ? 'cursor.cmd' : 'cursor';
    
    const child = spawn(cursorCmd, [rootPath], {
      detached: true,
      stdio: 'ignore',
    });
    
    child.unref();
  });

  // Show folder selection dialog
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Cursor Workspace',
      buttonLabel: 'Add Workspace',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Clear attention indicator
  ipcMain.handle('clear-attention', async () => {
    clearAttention();
  });
}

