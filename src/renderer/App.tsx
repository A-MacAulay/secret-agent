import React, { useState, useEffect, useCallback } from 'react';
import { WorkspaceState, AgentState } from '../shared/types';
import Header from './components/Header';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';

// Sort priority for agent states
const STATE_PRIORITY: Record<AgentState, number> = {
  waiting_for_user: 0,
  error: 1,
  thinking: 2,
  editing: 3,
  testing: 4,
  idle: 5,
  done: 6,
};

function sortWorkspaces(workspaces: WorkspaceState[]): WorkspaceState[] {
  return [...workspaces].sort((a, b) => {
    const stateA = a.status?.state || 'idle';
    const stateB = b.status?.state || 'idle';
    
    const priorityDiff = STATE_PRIORITY[stateA] - STATE_PRIORITY[stateB];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Secondary sort by lastSeen
    return new Date(b.config.lastSeen).getTime() - new Date(a.config.lastSeen).getTime();
  });
}

function App() {
  const [workspaces, setWorkspaces] = useState<WorkspaceState[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load workspaces on mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const ws = await window.secretAgent.getWorkspaces();
        setWorkspaces(sortWorkspaces(ws));
        
        // Auto-select first workspace if none selected
        if (ws.length > 0 && !selectedId) {
          const sorted = sortWorkspaces(ws);
          setSelectedId(sorted[0].config.workspaceId);
        }
      } catch (e) {
        console.error('Error loading workspaces:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  // Subscribe to workspace updates
  useEffect(() => {
    const unsubscribe = window.secretAgent.onWorkspaceUpdated((updatedState) => {
      setWorkspaces((prev) => {
        const idx = prev.findIndex(w => w.config.workspaceId === updatedState.config.workspaceId);
        if (idx === -1) {
          // New workspace added
          return sortWorkspaces([...prev, updatedState]);
        }
        // Update existing
        const updated = [...prev];
        updated[idx] = updatedState;
        return sortWorkspaces(updated);
      });
    });

    return unsubscribe;
  }, []);

  // Listen for focus-project events
  useEffect(() => {
    const handleFocusProject = (event: CustomEvent<string>) => {
      setSelectedId(event.detail);
    };

    window.addEventListener('focus-project', handleFocusProject as EventListener);
    return () => {
      window.removeEventListener('focus-project', handleFocusProject as EventListener);
    };
  }, []);

  const handleAddWorkspace = useCallback(async () => {
    const folderPath = await window.secretAgent.selectFolder();
    if (folderPath) {
      const newWorkspace = await window.secretAgent.addWorkspace(folderPath);
      if (newWorkspace) {
        setWorkspaces((prev) => sortWorkspaces([...prev, newWorkspace]));
        setSelectedId(newWorkspace.config.workspaceId);
      }
    }
  }, []);

  const handleRemoveWorkspace = useCallback(async (workspaceId: string) => {
    const success = await window.secretAgent.removeWorkspace(workspaceId);
    if (success) {
      setWorkspaces((prev) => prev.filter(w => w.config.workspaceId !== workspaceId));
      if (selectedId === workspaceId) {
        setSelectedId(workspaces.length > 1 ? workspaces[0].config.workspaceId : null);
      }
    }
  }, [selectedId, workspaces]);

  const handleSubmitResponse = useCallback(async (response: string) => {
    if (!selectedId) return;
    
    const workspace = workspaces.find(w => w.config.workspaceId === selectedId);
    if (!workspace) return;
    
    const questionId = workspace.handshake?.questionId || '';
    await window.secretAgent.submitResponse(selectedId, questionId, response);
  }, [selectedId, workspaces]);

  const selectedWorkspace = workspaces.find(w => w.config.workspaceId === selectedId) || null;
  
  // Count workspaces needing attention
  const attentionCount = workspaces.filter(
    w => w.status?.state === 'waiting_for_user' || w.status?.state === 'error'
  ).length;

  return (
    <div className="app">
      <Header attentionCount={attentionCount} />
      
      <div className="app-content">
        <ProjectList
          workspaces={workspaces}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={handleAddWorkspace}
          isLoading={isLoading}
        />
        
        <ProjectDetail
          workspace={selectedWorkspace}
          onSubmitResponse={handleSubmitResponse}
          onRemove={handleRemoveWorkspace}
        />
      </div>
    </div>
  );
}

export default App;


