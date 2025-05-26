'use client';

import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your content...",
  height = 300 
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className="tinymce-wrapper">
      <Editor
        apiKey="no-api-key" // Self-hosted mode to avoid domain registration
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          height: height,
          menubar: false,
          plugins: [
            // Core editing features
            'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
            // Premium features (available until Jun 9, 2025) - removed tinymcespellchecker
            'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'editimage', 'advtemplate', 'mentions', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown', 'importword', 'exportword', 'exportpdf'
          ],
          toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
          content_style: `
            body { 
              font-family: Arial, Helvetica, sans-serif; 
              font-size: 14px;
              line-height: 1.4;
            }
            ul, ol {
              margin: 0.5rem 0;
              padding-left: 1.5rem;
            }
            li {
              margin-bottom: 0.1rem;
              line-height: 1.4;
            }
            p {
              margin: 0.5rem 0;
            }
            h1, h2, h3, h4, h5, h6 {
              margin: 0.75rem 0 0.5rem 0;
              color: #1a4d5c;
            }
          `,
          placeholder: placeholder,
          branding: false,
          promotion: false,
          resize: 'vertical',
          statusbar: false,
          skin: 'oxide',
          content_css: 'default',
          directionality: 'ltr',
          language: 'en',
          // Cloud-hosted configuration - automatically handles domains
          cloud_image_cors_hosts: ['picsum.photos'],
          // Premium features configuration
          mergetags_list: [
            { value: 'Competition.Title', title: 'Competition Title' },
            { value: 'Competition.Theme', title: 'Competition Theme' },
            { value: 'User.Name', title: 'User Name' },
            { value: 'User.Email', title: 'User Email' },
          ],
          // Disable AI assistant for now
          ai_request: (request: any, respondWith: any) => respondWith.string(() => Promise.reject('AI Assistant not configured')),
          // Typography settings
          typography_langs: ['en-US'],
          typography_default_lang: 'en-US',
          // Advanced table settings
          table_use_colgroups: true,
          table_responsive_width: true,
          // Image editing settings
          editimage_cors_hosts: ['picsum.photos'],
          editimage_proxy_service_url: '/api/imageproxy',
          // Format options
          formats: {
            alignleft: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'text-left' },
            aligncenter: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'text-center' },
            alignright: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'text-right' },
            alignjustify: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'text-justify' }
          },
          // Block formats
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Preformatted=pre',
          // Font options
          font_family_formats: 'Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace; AkrutiKndPadmini=Akpdmi-n; Times New Roman=times new roman,times,serif; Verdana=verdana,geneva,sans-serif',
          font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
          // Line height options
          lineheight_formats: '1 1.1 1.2 1.3 1.4 1.5 2',
          // Advanced settings
          paste_data_images: true,
          paste_as_text: false,
          paste_webkit_styles: 'all',
          paste_retain_style_properties: 'all',
          automatic_uploads: true,
          file_picker_types: 'image',
          file_picker_callback: function (cb: any, value: any, meta: any) {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.onchange = function (event: Event) {
              const target = event.target as HTMLInputElement;
              const file = target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = function () {
                  const id = 'blobid' + (new Date()).getTime();
                  const blobCache = (window as any).tinymce.activeEditor.editorUpload.blobCache;
                  const base64 = (reader.result as string).split(',')[1];
                  const blobInfo = blobCache.create(id, file, base64);
                  blobCache.add(blobInfo);
                  cb(blobInfo.blobUri(), { title: file.name });
                };
                reader.readAsDataURL(file);
              }
            };
            input.click();
          }
        }}
      />
    </div>
  );
} 