import React, { useState, useEffect, CSSProperties } from 'react';
import { Input } from 'antd';

interface EditableTitleProps {
  title: string;
  onChange: (newTitle: string) => void;
  style?: CSSProperties;
  className?: string;
}

const EditableTitle: React.FC<EditableTitleProps> = ({ title: initialTitle, onChange, style, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(title);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onChange(title);
    }
  };
  return (
    <span>
      {isEditing ? (
        <Input
          size='small'
          value={title}
          onChange={handleChange}
          onBlur={handleBlur}
          onPressEnter={handleKeyPress}
          autoFocus
        />
      ) : (
        <span onClick={handleEdit} className={`${className} nopan`} style={{ ...style, lineHeight: '23px', cursor: 'pointer' }}>
          {title || '未命名'}
        </span>
      )}
    </span>
  );
};

export default EditableTitle;
