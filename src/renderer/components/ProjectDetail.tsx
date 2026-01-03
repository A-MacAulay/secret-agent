import React, { useState } from 'react';
import { WorkspaceState } from '../../shared/types';
import StatusBadge from './StatusBadge';
import QuestionView from './QuestionView';
import ResponseInput from './ResponseInput';

interface ProjectDetailProps {
  workspace: WorkspaceState | null;
  onSubmitResponse: (response: string) => Promise<void>;
  onRemove: (workspaceId: string) => void;
}

function shortenPath(fullPath: string): string {
  const parts = fullPath.split(/[/\\]/);
  if (parts.length <= 3) return fullPath;
  return `.../${parts.slice(-2).join('/')}`;
}

function ProjectDetail({ workspace, onSubmitResponse, onRemove }: ProjectDetailProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!workspace) {
    return (
      <main className="project-detail empty">
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <p>Select a project to view details</p>
        </div>
      </main>
    );
  }

  const { config, status, question } = workspace;
  const state = status?.state || 'idle';
  const isWaiting = state === 'waiting_for_user';

  const handleOpenFolder = () => {
    window.secretAgent.openFolder(config.rootPath);
  };

  const handleOpenInCursor = () => {
    window.secretAgent.openInCursor(config.rootPath);
  };

  const handleSubmit = async (response: string) => {
    setIsSubmitting(true);
    try {
      await onSubmitResponse(response);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = () => {
    if (confirm(`Remove "${config.displayName}" from Secret Agent?`)) {
      onRemove(config.workspaceId);
    }
  };

  return (
    <main className="project-detail">
      {/* Project Header */}
      <div className="detail-header">
        <div className="detail-title-row">
          <div
            className="detail-badge"
            style={{ backgroundColor: config.iconColor }}
          />
          <div className="detail-title">
            <h2>{config.displayName}</h2>
            <span className="detail-path" title={config.rootPath}>
              {shortenPath(config.rootPath)}
            </span>
          </div>
        </div>
        
        <div className="detail-status">
          <StatusBadge state={state} />
        </div>
      </div>

      {/* Task Info */}
      {status && (status.taskTitle || status.summary) && (
        <div className="detail-task">
          {status.taskTitle && (
            <div className="task-title">{status.taskTitle}</div>
          )}
          {status.summary && (
            <div className="task-summary">{status.summary}</div>
          )}
          
          {/* Progress Bar */}
          {status.progress && status.progress.totalSteps > 0 && (
            <div className="task-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(status.progress.currentStep / status.progress.totalSteps) * 100}%`,
                  }}
                />
              </div>
              <div className="progress-label">
                {status.progress.stepLabel} ({status.progress.currentStep}/{status.progress.totalSteps})
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question View (when waiting for user) */}
      {isWaiting && question && (
        <div className="detail-question">
          <QuestionView markdown={question} />
        </div>
      )}

      {/* Response Input */}
      {isWaiting && (
        <div className="detail-response">
          <ResponseInput 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Error Display */}
      {state === 'error' && status?.lastError && (
        <div className="detail-error">
          <div className="error-header">Error</div>
          <div className="error-message">{status.lastError}</div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="detail-actions">
        <button className="btn-action" onClick={handleOpenFolder}>
          <span className="btn-icon">📂</span>
          Open Folder
        </button>
        <button className="btn-action" onClick={handleOpenInCursor}>
          <span className="btn-icon">⌨️</span>
          Open in Cursor
        </button>
        <button className="btn-action btn-danger" onClick={handleRemove}>
          <span className="btn-icon">🗑️</span>
          Remove
        </button>
      </div>
    </main>
  );
}

export default ProjectDetail;


