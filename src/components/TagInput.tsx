import React from 'react';
import { Input, Tag } from 'antd';

const { TextArea } = Input;

interface TagInputProps {
  placeholders: string[];
  value?: string;
  onChange?: (value: string) => void;
}
const TagInput: React.FC<TagInputProps> = ({ placeholders, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target as HTMLTextAreaElement;
    onChange && onChange(textarea.value);
    const selectionStart = textarea.selectionStart; 
    const selectionEnd = textarea.selectionEnd;
    const updatedText = textarea.value;
    const beforeCursor = updatedText.slice(0, selectionStart);
    const afterCursor = updatedText.slice(selectionEnd);
    const regex = new RegExp(`\\{[^\\}]+`, 'g');
    let match;
    while ((match = regex.exec(beforeCursor)) !== null) {
      const placeholder = match[0];
      if (placeholder && beforeCursor.endsWith(placeholder)) {
        onChange && onChange(beforeCursor.slice(0, -placeholder.length) + afterCursor);
        break;
      }
    }
  };

  const handlePlaceholderClick = (placeholder: string) => {
    const textarea = document.getElementById('custom-textarea') as HTMLTextAreaElement;
    const position = textarea.selectionStart;
    const updatedText = (value && value.slice(0, position) || '') + `{${placeholder}}` + (value && value.slice(position) || '');
    onChange && onChange(updatedText);
    textarea.focus();
    textarea.setSelectionRange(position + placeholder.length, position + placeholder.length);
  };

  return (
    <>
      <TextArea
        size='small'
        id="custom-textarea"
        value={value}
        onChange={handleChange}
      />
      <div>
        {placeholders && placeholders.map(placeholder => (
          <Tag
            key={placeholder}
            onClick={() => handlePlaceholderClick(placeholder)}
            style={{ cursor: 'pointer' }}
          >
            {placeholder}
          </Tag>
        ))}
      </div>
    </>
  );
};

export default TagInput;
