import React, { useState, useEffect } from 'react';
import { Input } from 'antd';

interface EditableTitleProps {
  title: string;
  onChange: (newTitle: string) => void;
}

const EditableTitle: React.FC<EditableTitleProps> = ({ title: initialTitle, onChange }) => {
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
    <div>
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
        <div onClick={handleEdit} className="nopan" style={{ cursor: 'pointer' }}>
          {title}
        </div>
      )}
    </div>
  );
};

export default EditableTitle;
