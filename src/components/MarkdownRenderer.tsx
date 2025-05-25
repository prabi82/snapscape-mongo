'use client';

import '@uiw/react-md-editor/markdown-editor.css';
import MDEditor from '@uiw/react-md-editor';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // If content is empty or only whitespace, don't render anything
  if (!content || content.trim() === '') {
    return null;
  }

  return (
    <div className={`markdown-content ${className}`} data-color-mode="light">
      <MDEditor.Markdown 
        source={content} 
        style={{ 
          whiteSpace: 'pre-wrap',
          backgroundColor: 'transparent',
          color: 'inherit',
          padding: 0
        }}
        wrapperElement={{
          'data-color-mode': 'light'
        }}
      />
    </div>
  );
} 