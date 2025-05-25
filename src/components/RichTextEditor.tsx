'use client';

import { useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  id?: string;
  disabled?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  height = 300,
  id,
  disabled = false
}: RichTextEditorProps) {
  const editorRef = useRef(null);

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        preview="edit"
        hideToolbar={false}
        visibleDragbar={false}
        textareaProps={{
          placeholder: placeholder,
          disabled: disabled,
          id: id,
          style: {
            fontSize: 14,
            lineHeight: 1.5,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
        }}
        height={height}
        data-color-mode="light"
      />
    </div>
  );
} 