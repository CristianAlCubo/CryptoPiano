import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import '../assets/css/messageViewer.css';

interface MessageViewerProps {
  content: string;
}

const MessageViewer: React.FC<MessageViewerProps> = ({ content }) => {
  return (
    <div className="message-viewer-panel">
      <div className="panel-header">
        <span>Vista Previa</span>
      </div>
      <div className="preview-content">
        {content.trim() ? (
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <div className="preview-empty">
            <p>La vista previa aparecerá aquí</p>
            <p className="preview-hint">Escribe en el editor para ver el resultado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageViewer;

