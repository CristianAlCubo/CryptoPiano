import React from 'react';
import '../assets/css/textEditor.css';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ value, onChange, placeholder, onClear }) => {
  return (
    <div className="text-editor-panel">
      <div className="panel-header">
        <span>Editor</span>
        {onClear && (
          <button 
            className="clear-btn"
            onClick={onClear}
            title="Limpiar editor"
          >
            Limpiar
          </button>
        )}
      </div>
      <textarea
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

export default TextEditor;

