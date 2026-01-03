import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { WorkspaceConfig, WorkspaceState } from '../../shared/types';
import { getRandomColor, DEFAULT_AGENT_STATUS, DEFAULT_HANDSHAKE } from '../types/contracts';
import { parseContractFiles, ensureProjectJson } from './contract-parser';
import { watchWorkspace, unwatchWorkspace } from './file-watcher';
import { getPopupWindow } from '../windows';

interface StoreSchema {
  workspaces: WorkspaceConfig[];
}

const store = new Store<StoreSchema>({
  name: 'config',
  defaults: {
    workspaces: [],
  },
});

// In-memory cache of workspace states
const workspaceStates = new Map<string, WorkspaceState>();

export async function initWorkspaceRegistry(): Promise<void> {
  const workspaces = store.get('workspaces', []);
  
  for (const config of workspaces) {
    // Initialize state for each workspace
    const state = await loadWorkspaceState(config);
    workspaceStates.set(config.workspaceId, state);
  }
}

export function getWorkspaces(): WorkspaceState[] {
  return Array.from(workspaceStates.values());
}

export function getWorkspace(workspaceId: string): WorkspaceState | null {
  return workspaceStates.get(workspaceId) || null;
}

export async function addWorkspace(rootPath: string): Promise<WorkspaceState | null> {
  // Check if path exists
  if (!fs.existsSync(rootPath)) {
    console.error('Workspace path does not exist:', rootPath);
    return null;
  }

  // Check if already registered
  const workspaces = store.get('workspaces', []);
  const existing = workspaces.find(w => w.rootPath === rootPath);
  if (existing) {
    return workspaceStates.get(existing.workspaceId) || null;
  }

  // Ensure .cursor_companion folder and project.json exist
  const companionDir = path.join(rootPath, '.cursor_companion');
  const projectJson = await ensureProjectJson(companionDir, path.basename(rootPath));

  // Create workspace config
  const config: WorkspaceConfig = {
    workspaceId: projectJson.workspaceId,
    displayName: projectJson.projectName,
    rootPath,
    iconColor: getRandomColor(),
    lastSeen: new Date().toISOString(),
  };

  // Save to store
  workspaces.push(config);
  store.set('workspaces', workspaces);

  // Load full state
  const state = await loadWorkspaceState(config);
  workspaceStates.set(config.workspaceId, state);

  // Start watching this workspace
  watchWorkspace(config.workspaceId, rootPath);

  // Notify renderer
  notifyWorkspaceUpdated(state);

  return state;
}

export function removeWorkspace(workspaceId: string): boolean {
  const workspaces = store.get('workspaces', []);
  const index = workspaces.findIndex(w => w.workspaceId === workspaceId);
  
  if (index === -1) {
    return false;
  }

  // Stop watching
  unwatchWorkspace(workspaceId);

  // Remove from store
  workspaces.splice(index, 1);
  store.set('workspaces', workspaces);

  // Remove from memory
  workspaceStates.delete(workspaceId);

  return true;
}

export async function updateWorkspaceState(workspaceId: string): Promise<void> {
  const config = store.get('workspaces', []).find(w => w.workspaceId === workspaceId);
  if (!config) return;

  const state = await loadWorkspaceState(config);
  workspaceStates.set(workspaceId, state);

  // Update lastSeen
  const workspaces = store.get('workspaces', []);
  const idx = workspaces.findIndex(w => w.workspaceId === workspaceId);
  if (idx !== -1) {
    workspaces[idx].lastSeen = new Date().toISOString();
    store.set('workspaces', workspaces);
  }

  // Notify renderer
  notifyWorkspaceUpdated(state);
}

async function loadWorkspaceState(config: WorkspaceConfig): Promise<WorkspaceState> {
  const companionDir = path.join(config.rootPath, '.cursor_companion');
  const contracts = await parseContractFiles(companionDir);
  
  const isConnected = fs.existsSync(companionDir);

  return {
    config,
    project: contracts.project,
    status: contracts.status || {
      workspaceId: config.workspaceId,
      ...DEFAULT_AGENT_STATUS,
      lastUpdated: new Date().toISOString(),
    },
    handshake: contracts.handshake || {
      workspaceId: config.workspaceId,
      ...DEFAULT_HANDSHAKE,
    },
    question: contracts.question,
    isConnected,
  };
}

function notifyWorkspaceUpdated(state: WorkspaceState): void {
  const popup = getPopupWindow();
  if (popup && !popup.isDestroyed()) {
    popup.webContents.send('workspace-updated', state);
  }
}

export function getWorkspaceConfig(workspaceId: string): WorkspaceConfig | null {
  const workspaces = store.get('workspaces', []);
  return workspaces.find(w => w.workspaceId === workspaceId) || null;
}

