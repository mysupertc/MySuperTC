import React, { useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { UploadFile } from '@/api/integrations';

// Custom Image Handler to upload images
const imageHandler = function() {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = async () => {
    const file = input.files[0];
    if (file) {
      const quill = this.quill;
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='); // Placeholder
      quill.setSelection(range.index + 1);

      try {
        const response = await UploadFile({ file });
        quill.deleteText(range.index, 1);
        quill.insertEmbed(range.index, 'image', response.file_url);
        quill.setSelection(range.index + 1);
      } catch (error) {
        console.error('Image upload failed:', error);
        quill.deleteText(range.index, 1);
      }
    }
  };
};

const modules = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean']
    ],
    handlers: {
      image: imageHandler
    }
  },
  clipboard: {
    matchVisual: false,
  }
};

export default function RichTextEditor({ value, onChange, userPreferences, onPreferencesChange }) {
  const quillRef = useRef(null);

  useEffect(() => {
    if (quillRef.current && userPreferences) {
      const quill = quillRef.current.getEditor();
      const root = quill.root;
      root.style.fontFamily = userPreferences.fontFamily || 'Arial';
      root.style.fontSize = userPreferences.fontSize || '14px';
      root.style.color = userPreferences.fontColor || '#000000';
    }
  }, [userPreferences]);

  const handleTextChange = (content, delta, source, editor) => {
    onChange(content);
    // Auto-link URLs
    const text = editor.getText();
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      const url = match[0];
      const index = match.index;
      const length = url.length;
      if (!editor.getFormat(index, length).link) {
        editor.formatText(index, length, 'link', url, 'user');
      }
    }
  };
  
  return (
    <ReactQuill 
      ref={quillRef}
      theme="snow" 
      value={value} 
      onChange={handleTextChange}
      modules={modules}
      className="h-full"
    />
  );
}