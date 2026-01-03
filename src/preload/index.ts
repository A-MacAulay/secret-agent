import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { SecretAgentAPI, WorkspaceState } from '../shared/types';

const api: SecretAgentAPI = {
  getWorkspaces: () => ipcRenderer.invoke('get-workspaces'),
  
  addWorkspace: (rootPath: string) => ipcRenderer.invoke('add-workspace', rootPath),
  
  removeWorkspace: (workspaceId: string) => ipcRenderer.invoke('remove-workspace', workspaceId),
  
  getProjectState: (workspaceId: string) => ipcRenderer.invoke('get-project-state', workspaceId),
  
  submitResponse: (workspaceId: string, questionId: string, response: string) => 
    ipcRenderer.invoke('submit-response', workspaceId, questionId, response),
  
  openFolder: (rootPath: string) => {
    ipcRenderer.invoke('open-folder', rootPath);
  },
  
  openInCursor: (rootPath: string) => {
    ipcRenderer.invoke('open-in-cursor', rootPath);
  },

  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  onWorkspaceUpdated: (callback: (state: WorkspaceState) => void) => {
    const handler = (_event: IpcRendererEvent, state: WorkspaceState) => {
      callback(state);
    };
    
    ipcRenderer.on('workspace-updated', handler);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('workspace-updated', handler);
    };
  },
};

// Also listen for focus-project events
ipcRenderer.on('focus-project', (_event, workspaceId: string) => {
  // Dispatch custom event that React can listen to
  window.dispatchEvent(new CustomEvent('focus-project', { detail: workspaceId }));
});

contextBridge.exposeInMainWorld('secretAgent', api);

