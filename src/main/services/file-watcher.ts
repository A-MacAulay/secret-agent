import chokidar, { FSWatcher } from 'chokidar';
import * as path from 'path';
import { updateWorkspaceState, getWorkspaces, getWorkspaceConfig } from './workspace-registry';
import { showNotification } from './notification';
import { AgentStatus } from '../../shared/types';
import * as fs from 'fs';

const watchers = new Map<string, FSWatcher>();
const previousStates = new Map<string, string>(); // Track previous state to detect transitions

// Debounce timers
const debounceTimers = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_MS = 300;

export function initFileWatcher(): void {
  // Start watching all registered workspaces
  const workspaces = getWorkspaces();
  
  for (const workspace of workspaces) {
    watchWorkspace(workspace.config.workspaceId, workspace.config.rootPath);
  }
}

export function watchWorkspace(workspaceId: string, rootPath: string): void {
  // Don't create duplicate watchers
  if (watchers.has(workspaceId)) {
    return;
  }

  const companionDir = path.join(rootPath, '.cursor_companion');
  
  // Watch the companion directory
  const watcher = chokidar.watch(companionDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
    // Enable polling as fallback for network drives
    usePolling: false,
    interval: 1000,
  });

  watcher.on('add', (filePath) => handleFileChange(workspaceId, filePath));
  watcher.on('change', (filePath) => handleFileChange(workspaceId, filePath));
  watcher.on('unlink', (filePath) => handleFileChange(workspaceId, filePath));
  
  watcher.on('error', (error) => {
    console.error(`Watcher error for ${workspaceId}:`, error);
  });

  watchers.set(workspaceId, watcher);
  console.log(`Started watching workspace: ${workspaceId} at ${companionDir}`);
}

export function unwatchWorkspace(workspaceId: string): void {
  const watcher = watchers.get(workspaceId);
  if (watcher) {
    watcher.close();
    watchers.delete(workspaceId);
    previousStates.delete(workspaceId);
    console.log(`Stopped watching workspace: ${workspaceId}`);
  }
}

export function stopAllWatchers(): void {
  for (const [workspaceId, watcher] of watchers) {
    watcher.close();
    console.log(`Stopped watching workspace: ${workspaceId}`);
  }
  watchers.clear();
  previousStates.clear();
  debounceTimers.clear();
}

function handleFileChange(workspaceId: string, filePath: string): void {
  // Debounce rapid file changes
  const existingTimer = debounceTimers.get(workspaceId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(async () => {
    debounceTimers.delete(workspaceId);
    
    const previousState = previousStates.get(workspaceId);
    
    // Update workspace state
    await updateWorkspaceState(workspaceId);
    
    // Check for state transitions that need notifications
    const config = getWorkspaceConfig(workspaceId);
    if (config) {
      await checkForNotifications(workspaceId, config.rootPath, previousState);
    }
  }, DEBOUNCE_MS);

  debounceTimers.set(workspaceId, timer);
}

async function checkForNotifications(
  workspaceId: string, 
  rootPath: string,
  previousState: string | undefined
): Promise<void> {
  const statusPath = path.join(rootPath, '.cursor_companion', 'agent-status.json');
  
  if (!fs.existsSync(statusPath)) {
    return;
  }

  try {
    const content = fs.readFileSync(statusPath, 'utf-8');
    const status: AgentStatus = JSON.parse(content);
    
    const currentState = status.state;
    
    // Save current state for next comparison
    previousStates.set(workspaceId, currentState);
    
    // Trigger notification if transitioning to waiting_for_user
    if (currentState === 'waiting_for_user' && previousState !== 'waiting_for_user') {
      const config = getWorkspaceConfig(workspaceId);
      if (config) {
        showNotification(
          config.displayName,
          status.summary || 'Agent is waiting for your input',
          workspaceId
        );
      }
    }
    
    // Also notify on errors
    if (currentState === 'error' && previousState !== 'error') {
      const config = getWorkspaceConfig(workspaceId);
      if (config) {
        showNotification(
          config.displayName,
          status.lastError || 'An error occurred',
          workspaceId
        );
      }
    }
  } catch (e) {
    console.error('Error checking for notifications:', e);
  }
}

