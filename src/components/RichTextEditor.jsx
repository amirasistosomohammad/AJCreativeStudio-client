import React, { useRef, useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

const RichTextEditor = ({ value, onChange, placeholder, height = 300, disabled = false, className = '' }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = (e) => {
    const content = e.target.innerHTML;
    const syntheticEvent = {
      target: {
        value: content,
        name: 'content'
      }
    };
    onChange(syntheticEvent);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const ToolbarButton = ({ icon, title, onClick, active = false }) => (
    <button
      type="button"
      className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
      onClick={onClick}
      title={title}
      style={{
        minWidth: '32px',
        padding: '4px 8px',
        border: '1px solid #dee2e6',
        backgroundColor: active ? '#0d6efd' : '#fff',
        color: active ? '#fff' : '#212529',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.target.style.backgroundColor = '#f8f9fa';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.target.style.backgroundColor = '#fff';
        }
      }}
    >
      <i className={icon}></i>
    </button>
  );

  const hasError = className.includes('is-invalid');
  
  return (
    <div className={className}>
      {/* Toolbar */}
      <div
        style={{
          border: hasError ? '1px solid #dc3545' : '1px solid #dee2e6',
          borderBottom: 'none',
          backgroundColor: '#f8f9fa',
          padding: '8px',
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
          borderRadius: '4px 4px 0 0',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <ToolbarButton
            icon="fas fa-bold"
            title="Bold"
            onClick={() => execCommand('bold')}
          />
          <ToolbarButton
            icon="fas fa-italic"
            title="Italic"
            onClick={() => execCommand('italic')}
          />
          <ToolbarButton
            icon="fas fa-underline"
            title="Underline"
            onClick={() => execCommand('underline')}
          />
          <ToolbarButton
            icon="fas fa-strikethrough"
            title="Strikethrough"
            onClick={() => execCommand('strikeThrough')}
          />
        </div>
        
        <div style={{ width: '1px', backgroundColor: '#dee2e6', margin: '0 4px' }}></div>
        
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <ToolbarButton
            icon="fas fa-align-left"
            title="Align Left"
            onClick={() => execCommand('justifyLeft')}
          />
          <ToolbarButton
            icon="fas fa-align-center"
            title="Align Center"
            onClick={() => execCommand('justifyCenter')}
          />
          <ToolbarButton
            icon="fas fa-align-right"
            title="Align Right"
            onClick={() => execCommand('justifyRight')}
          />
          <ToolbarButton
            icon="fas fa-align-justify"
            title="Justify"
            onClick={() => execCommand('justifyFull')}
          />
        </div>
        
        <div style={{ width: '1px', backgroundColor: '#dee2e6', margin: '0 4px' }}></div>
        
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <ToolbarButton
            icon="fas fa-list-ul"
            title="Bullet List"
            onClick={() => execCommand('insertUnorderedList')}
          />
          <ToolbarButton
            icon="fas fa-list-ol"
            title="Numbered List"
            onClick={() => execCommand('insertOrderedList')}
          />
          <ToolbarButton
            icon="fas fa-outdent"
            title="Decrease Indent"
            onClick={() => execCommand('outdent')}
          />
          <ToolbarButton
            icon="fas fa-indent"
            title="Increase Indent"
            onClick={() => execCommand('indent')}
          />
        </div>
        
        <div style={{ width: '1px', backgroundColor: '#dee2e6', margin: '0 4px' }}></div>
        
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <ToolbarButton
            icon="fas fa-link"
            title="Insert Link"
            onClick={() => {
              const url = prompt('Enter URL:');
              if (url) {
                execCommand('createLink', url);
              }
            }}
          />
          <ToolbarButton
            icon="fas fa-eraser"
            title="Remove Formatting"
            onClick={() => execCommand('removeFormat')}
          />
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          minHeight: `${height}px`,
          border: hasError ? '1px solid #dc3545' : '1px solid #dee2e6',
          borderTop: 'none',
          padding: '12px',
          outline: isFocused ? (hasError ? '2px solid #dc3545' : '2px solid #0d6efd') : 'none',
          outlineOffset: '-1px',
          borderRadius: '0 0 4px 4px',
          backgroundColor: disabled ? '#f8f9fa' : '#fff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.6',
          overflowY: 'auto',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        data-placeholder={placeholder || 'Start typing...'}
        suppressContentEditableWarning={true}
      />
      
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #6c757d;
          font-style: italic;
        }
      `}</style>
      
      <small className="text-muted mt-2 d-block">
        <i className="fas fa-info-circle me-1"></i>
        Format your text using the toolbar above. Works just like Word - select text and click formatting buttons.
      </small>
    </div>
  );
};

export default RichTextEditor;
