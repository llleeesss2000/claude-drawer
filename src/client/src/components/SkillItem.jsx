import React from 'react';

const SkillItem = ({ skill: { name, source }, checked, onToggle }) => {
  const getSourceColor = () => {
    switch (source) {
      case 'official':
        return '#2196F3'; // 藍色
      case 'community':
        return '#FFC107'; // 黃色
      case 'local':
        return '#757575'; // 灰色
      default:
        return '#757575';
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        style={{ marginRight: '10px' }}
      />
      <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{name}</span>
      <span
        style={{
          backgroundColor: getSourceColor(),
          color: source === 'community' ? '#000' : '#fff',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px',
          textTransform: 'uppercase'
        }}
      >
        {source}
      </span>
    </div>
  );
};

export default SkillItem;