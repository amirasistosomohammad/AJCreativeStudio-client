import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';

const MarkdownRenderer = ({ content, className = '', style = {} }) => {
  if (!content) return null;

  // Check if content is already HTML (from legacy data)
  const isHTML = /<[a-z][\s\S]*>/i.test(content);

  if (isHTML) {
    // Sanitize and render HTML (from TinyMCE or other rich text editors)
    const sanitizedHTML = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'blockquote', 'pre', 'code'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class', 'color', 'background-color'],
    });

    return (
      <div
        className={className}
        style={{
          ...style,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
    );
  }

  // Render as Markdown
  return (
    <div className={className} style={style}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => (
            <p style={{ marginBottom: '0.75rem', lineHeight: 1.6 }} {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong style={{ fontWeight: 700 }} {...props} />
          ),
          em: ({ node, ...props }) => <em {...props} />,
          ul: ({ node, ...props }) => (
            <ul style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem' }} {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem' }} {...props} />
          ),
          li: ({ node, ...props }) => (
            <li style={{ marginBottom: '0.25rem', lineHeight: 1.6 }} {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }} {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }} {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 700 }} {...props} />
          ),
          br: () => <br />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

