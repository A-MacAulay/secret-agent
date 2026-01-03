import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  ProjectConfig, 
  AgentStatus, 
  Handshake,
  QuestionState,
} from '../../shared/types';

export interface ParsedContracts {
  project: ProjectConfig | null;
  status: AgentStatus | null;
  handshake: Handshake | null;
  question: string | null;
  log: string | null;
}

export async function parseContractFiles(companionDir: string): Promise<ParsedContracts> {
  const result: ParsedContracts = {
    project: null,
    status: null,
    handshake: null,
    question: null,
    log: null,
  };

  if (!fs.existsSync(companionDir)) {
    return result;
  }

  // Parse project.json
  const projectPath = path.join(companionDir, 'project.json');
  if (fs.existsSync(projectPath)) {
    try {
      const content = fs.readFileSync(projectPath, 'utf-8');
      result.project = JSON.parse(content) as ProjectConfig;
    } catch (e) {
      console.error('Error parsing project.json:', e);
    }
  }

  // Parse agent-status.json
  const statusPath = path.join(companionDir, 'agent-status.json');
  if (fs.existsSync(statusPath)) {
    try {
      const content = fs.readFileSync(statusPath, 'utf-8');
      result.status = JSON.parse(content) as AgentStatus;
    } catch (e) {
      console.error('Error parsing agent-status.json:', e);
    }
  }

  // Parse handshake.json
  const handshakePath = path.join(companionDir, 'handshake.json');
  if (fs.existsSync(handshakePath)) {
    try {
      const content = fs.readFileSync(handshakePath, 'utf-8');
      result.handshake = JSON.parse(content) as Handshake;
    } catch (e) {
      console.error('Error parsing handshake.json:', e);
    }
  }

  // Read agent-questions.md
  const questionsPath = path.join(companionDir, 'agent-questions.md');
  if (fs.existsSync(questionsPath)) {
    try {
      result.question = fs.readFileSync(questionsPath, 'utf-8');
    } catch (e) {
      console.error('Error reading agent-questions.md:', e);
    }
  }

  // Read agent-log.md
  const logPath = path.join(companionDir, 'agent-log.md');
  if (fs.existsSync(logPath)) {
    try {
      result.log = fs.readFileSync(logPath, 'utf-8');
    } catch (e) {
      console.error('Error reading agent-log.md:', e);
    }
  }

  return result;
}

export async function ensureProjectJson(companionDir: string, projectName: string): Promise<ProjectConfig> {
  // Create companion directory if it doesn't exist
  if (!fs.existsSync(companionDir)) {
    fs.mkdirSync(companionDir, { recursive: true });
  }

  const projectPath = path.join(companionDir, 'project.json');
  
  // If project.json exists, read and return it
  if (fs.existsSync(projectPath)) {
    try {
      const content = fs.readFileSync(projectPath, 'utf-8');
      return JSON.parse(content) as ProjectConfig;
    } catch (e) {
      console.error('Error reading existing project.json:', e);
    }
  }

  // Create new project.json
  const now = new Date().toISOString();
  const project: ProjectConfig = {
    workspaceId: uuidv4(),
    projectName,
    createdAt: now,
    updatedAt: now,
  };

  fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
  
  return project;
}

export async function writeUserResponse(
  companionDir: string, 
  projectName: string,
  questionId: string, 
  response: string
): Promise<boolean> {
  try {
    const responsePath = path.join(companionDir, 'user-response.md');
    const content = `## Response (Project: ${projectName}, Question ID: ${questionId})

${response}
`;
    
    fs.writeFileSync(responsePath, content);

    // Update handshake
    const handshakePath = path.join(companionDir, 'handshake.json');
    let handshake: Partial<Handshake> = {};
    
    if (fs.existsSync(handshakePath)) {
      try {
        handshake = JSON.parse(fs.readFileSync(handshakePath, 'utf-8'));
      } catch (e) {
        // Ignore parse errors
      }
    }

    handshake.questionState = 'answered' as QuestionState;
    handshake.lastUserResponseUpdated = new Date().toISOString();

    fs.writeFileSync(handshakePath, JSON.stringify(handshake, null, 2));

    return true;
  } catch (e) {
    console.error('Error writing user response:', e);
    return false;
  }
}

export function extractQuestionId(questionContent: string | null): string {
  if (!questionContent) return '';
  
  // Try to extract question ID from markdown header
  // Format: ## Question (ID: 42)
  const match = questionContent.match(/##\s*Question\s*\(ID:\s*([^)]+)\)/i);
  return match ? match[1].trim() : '';
}

