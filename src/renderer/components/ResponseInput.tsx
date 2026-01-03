import React, { useState, useRef, useEffect } from 'react';

interface ResponseInputProps {
  onSubmit: (response: string) => Promise<void>;
  isSubmitting: boolean;
}

function ResponseInput({ onSubmit, isSubmitting }: ResponseInputProps) {
  const [response, setResponse] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus textarea when component mounts
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!response.trim() || isSubmitting) return;
    
    await onSubmit(response);
    setResponse('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="response-input">
      <textarea
        ref={textareaRef}
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your response..."
        disabled={isSubmitting}
        rows={4}
      />
      <div className="response-actions">
        <span className="response-hint">
          Press <kbd>⌘</kbd>+<kbd>Enter</kbd> to send
        </span>
        <button
          className="btn-submit"
          onClick={handleSubmit}
          disabled={!response.trim() || isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Response'}
        </button>
      </div>
    </div>
  );
}

export default ResponseInput;


