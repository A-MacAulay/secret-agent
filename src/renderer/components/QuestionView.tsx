import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QuestionViewProps {
  markdown: string;
}

function QuestionView({ markdown }: QuestionViewProps) {
  return (
    <div className="question-view">
      <div className="question-header">
        <span className="question-icon">❓</span>
        <span>Agent Question</span>
      </div>
      <div className="question-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default QuestionView;


