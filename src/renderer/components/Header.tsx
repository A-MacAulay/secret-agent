import React from 'react';

interface HeaderProps {
  attentionCount: number;
}

function Header({ attentionCount }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-title">
        <span className="header-icon">🕵️</span>
        <span className="header-text">Secret Agent</span>
      </div>
      
      {attentionCount > 0 && (
        <div className="header-attention">
          <span className="attention-badge">{attentionCount}</span>
          <span className="attention-text">needs attention</span>
        </div>
      )}
    </header>
  );
}

export default Header;


