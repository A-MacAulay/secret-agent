import React from 'react';
import { WorkspaceState } from '../../shared/types';
import ProjectCard from './ProjectCard';

interface ProjectListProps {
  workspaces: WorkspaceState[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  isLoading: boolean;
}

function ProjectList({ workspaces, selectedId, onSelect, onAdd, isLoading }: ProjectListProps) {
  if (isLoading) {
    return (
      <aside className="project-list">
        <div className="project-list-loading">
          <div className="loading-spinner" />
          <span>Loading...</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="project-list">
      <div className="project-list-header">
        <span className="project-list-title">Projects</span>
        <button className="btn-add" onClick={onAdd} title="Add workspace">
          +
        </button>
      </div>
      
      <div className="project-list-items">
        {workspaces.length === 0 ? (
          <div className="project-list-empty">
            <p>No workspaces added yet</p>
            <button className="btn-add-workspace" onClick={onAdd}>
              Add Workspace
            </button>
          </div>
        ) : (
          workspaces.map((workspace) => (
            <ProjectCard
              key={workspace.config.workspaceId}
              workspace={workspace}
              isSelected={workspace.config.workspaceId === selectedId}
              onClick={() => onSelect(workspace.config.workspaceId)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

export default ProjectList;


