// Workspace registry types
export interface WorkspaceConfig {
  workspaceId: string;
  displayName: string;
  rootPath: string;
  iconColor: string;
  lastSeen: string;
}

// Contract file types
export interface ProjectConfig {
  workspaceId: string;
  projectName: string;
  repoSlug?: string;
  createdAt: string;
  updatedAt: string;
}

export type AgentState = 
  | 'idle' 
  | 'thinking' 
  | 'editing' 
  | 'testing' 
  | 'waiting_for_user' 
  | 'done' 
  | 'error';

export interface AgentProgress {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

export interface AgentStatus {
  workspaceId: string;
  state: AgentState;
  taskTitle: string;
  summary: string;
  progress: AgentProgress | null;
  lastUpdated: string;
  activeFiles: string[];
  lastError: string | null;
}

export type QuestionState = 
  | 'none' 
  | 'asked' 
  | 'acknowledged' 
  | 'answered' 
  | 'consumed';

export interface Handshake {
  workspaceId: string;
  questionId: string;
  questionState: QuestionState;
  lastQuestionUpdated: string;
  lastUserResponseUpdated: string;
}

// Combined workspace state for UI
export interface WorkspaceState {
  config: WorkspaceConfig;
  project: ProjectConfig | null;
  status: AgentStatus | null;
  handshake: Handshake | null;
  question: string | null;
  isConnected: boolean;
}

// IPC channel types
export interface IPCChannels {
  'get-workspaces': () => WorkspaceState[];
  'add-workspace': (rootPath: string) => WorkspaceState | null;
  'remove-workspace': (workspaceId: string) => boolean;
  'get-project-state': (workspaceId: string) => WorkspaceState | null;
  'submit-response': (workspaceId: string, questionId: string, response: string) => boolean;
  'open-folder': (rootPath: string) => void;
  'open-in-cursor': (rootPath: string) => void;
  'workspace-updated': (state: WorkspaceState) => void;
}

// Preload API exposed to renderer
export interface SecretAgentAPI {
  getWorkspaces: () => Promise<WorkspaceState[]>;
  addWorkspace: (rootPath: string) => Promise<WorkspaceState | null>;
  removeWorkspace: (workspaceId: string) => Promise<boolean>;
  getProjectState: (workspaceId: string) => Promise<WorkspaceState | null>;
  submitResponse: (workspaceId: string, questionId: string, response: string) => Promise<boolean>;
  openFolder: (rootPath: string) => void;
  openInCursor: (rootPath: string) => void;
  selectFolder: () => Promise<string | null>;
  onWorkspaceUpdated: (callback: (state: WorkspaceState) => void) => () => void;
}

declare global {
  interface Window {
    secretAgent: SecretAgentAPI;
  }
}


