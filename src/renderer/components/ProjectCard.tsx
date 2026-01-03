import React from 'react';
import { WorkspaceState } from '../../shared/types';
import StatusBadge from './StatusBadge';

interface ProjectCardProps {
  workspace: WorkspaceState;
  isSelected: boolean;
  onClick: () => void;
}

function ProjectCard({ workspace, isSelected, onClick }: ProjectCardProps) {
  const { config, status, handshake } = workspace;
  const state = status?.state || 'idle';
  const needsAttention = state === 'waiting_for_user' || state === 'error';
  const hasUnreadQuestion = handshake?.questionState === 'asked';

  return (
    <div
      className={`project-card ${isSelected ? 'selected' : ''} ${needsAttention ? 'attention' : ''}`}
      onClick={onClick}
    >
      <div 
        className="project-badge"
        style={{ backgroundColor: config.iconColor }}
      />
      
      <div className="project-info">
        <div className="project-name">{config.displayName}</div>
        <div className="project-status-row">
          <StatusBadge state={state} />
          {hasUnreadQuestion && (
            <span className="unread-indicator" title="Unread question">!</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;


