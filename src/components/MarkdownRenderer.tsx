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

  // Check if content contains HTML tags (including simple ones from Lexical editor)
  const containsHTML = /<[^>]*>/g.test(content) || 
                      content.includes('<strong>') || 
                      content.includes('<em>') || 
                      content.includes('<p>') ||
                      content.includes('<ul>') ||
                      content.includes('<li>');

  if (containsHTML) {
    // Content is HTML - render directly
    return (
      <>
        <style dangerouslySetInnerHTML={{
          __html: `
            .html-content strong {
              font-weight: bold !important;
            }
            .html-content em {
              font-style: italic !important;
            }
          `
        }} />
        <div 
          className={`html-content ${className}`}
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            lineHeight: '1.4'
          }}
        />
      </>
    );
  }

  // Content is plain text - convert to HTML with line breaks preserved
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Check if line starts with bullet point
        if (line.startsWith('• ')) {
          return `<li>${line.substring(2)}</li>`;
        }
        return `<p>${line}</p>`;
      })
      .join('')
      .replace(/(<li>.*<\/li>)+/g, (match) => `<ul>${match}</ul>`); // Wrap consecutive li elements in ul
  };

  const formattedContent = formatContent(content);

  return (
    <div 
      className={`text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
      style={{
        lineHeight: '1.4'
      }}
    />
  );
} 