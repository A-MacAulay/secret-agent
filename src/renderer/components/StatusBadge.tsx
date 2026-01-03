import React from 'react';
import { AgentState } from '../../shared/types';

interface StatusBadgeProps {
  state: AgentState;
}

const STATE_LABELS: Record<AgentState, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  editing: 'Editing',
  testing: 'Testing',
  waiting_for_user: 'Waiting',
  done: 'Done',
  error: 'Error',
};

const STATE_CLASSES: Record<AgentState, string> = {
  idle: 'state-idle',
  thinking: 'state-working',
  editing: 'state-working',
  testing: 'state-working',
  waiting_for_user: 'state-waiting',
  done: 'state-done',
  error: 'state-error',
};

function StatusBadge({ state }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${STATE_CLASSES[state]}`}>
      {STATE_LABELS[state]}
    </span>
  );
}

export default StatusBadge;


