import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';

const MarkdownEditor = ({ value, onChange, placeholder, rows = 6, showPreview = true }) => {
  const [showPreviewPane, setShowPreviewPane] = useState(false);

  const handleChange = (e) => {
    onChange(e);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-muted">
          <i className="fas fa-info-circle me-1"></i>
          Supports Markdown: <strong>**bold**</strong>, line breaks, emojis, etc.
        </small>
        {showPreview && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowPreviewPane(!showPreviewPane)}
            style={{ fontSize: '0.75rem' }}
          >
            <i className={`fas fa-${showPreviewPane ? 'edit' : 'eye'} me-1`}></i>
            {showPreviewPane ? 'Edit' : 'Preview'}
          </button>
        )}
      </div>
      
      {showPreviewPane ? (
        <div
          className="form-control"
          style={{
            minHeight: `${rows * 1.5}rem`,
            backgroundColor: '#ffffff',
            overflow: 'auto',
            padding: '0.75rem',
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => <p style={{ marginBottom: '0.75rem' }} {...props} />,
              strong: ({ node, ...props }) => <strong style={{ fontWeight: 700 }} {...props} />,
              em: ({ node, ...props }) => <em {...props} />,
              ul: ({ node, ...props }) => <ul style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem' }} {...props} />,
              ol: ({ node, ...props }) => <ol style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem' }} {...props} />,
              li: ({ node, ...props }) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
              h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }} {...props} />,
              h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }} {...props} />,
              h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 700 }} {...props} />,
            }}
          >
            {value || ''}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          className="form-control"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          style={{
            resize: 'vertical',
            backgroundColor: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
          }}
        />
      )}
    </div>
  );
};

export default MarkdownEditor;

