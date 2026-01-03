// Re-export shared types for main process
export type {
  WorkspaceConfig,
  ProjectConfig,
  AgentState,
  AgentProgress,
  AgentStatus,
  QuestionState,
  Handshake,
  WorkspaceState,
} from '../../shared/types';

// Default values for contract files
export const DEFAULT_AGENT_STATUS = {
  state: 'idle' as const,
  taskTitle: '',
  summary: '',
  progress: null,
  activeFiles: [],
  lastError: null,
};

export const DEFAULT_HANDSHAKE = {
  questionId: '',
  questionState: 'none' as const,
  lastQuestionUpdated: '',
  lastUserResponseUpdated: '',
};

// Color palette for workspace badges
export const WORKSPACE_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFEAA7', // Soft Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Sunflower
  '#BB8FCE', // Lavender
  '#85C1E9', // Light Blue
];

export function getRandomColor(): string {
  return WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)];
}

