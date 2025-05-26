'use client';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // If content is empty or only whitespace, don't render anything
  if (!content || content.trim() === '') {
    return null;
  }

  // Sanitize and render HTML content from TinyMCE
  return (
    <div 
      className={`tinymce-content ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        lineHeight: '1.4'
      }}
    />
  );
} 