import React from 'react';

const McpItem = ({ mcp, onToggle }) => {
  const isActive = !mcp.disabled;

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: mcp.disabled ? '#888' : '#4CAF50',
              marginRight: '10px'
            }}
          />
          <span style={{ fontWeight: 500 }}>{mcp.name}</span>
        </div>
        <button
          onClick={() => onToggle(mcp.name, !mcp.disabled)}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: isActive ? '#f44336' : '#4CAF50',
            color: '#fff',
            fontSize: '14px'
          }}
        >
          {isActive ? '停用' : '啟用'}
        </button>
      </div>
      {mcp.disabled && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '22px' }}>
          此 MCP 已暫停，設定仍保留，隨時可重新啟用
        </div>
      )}
    </div>
  );
};

export default McpItem;