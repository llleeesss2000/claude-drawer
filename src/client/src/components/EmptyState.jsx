import React from 'react';

const EmptyState = ({ message, ctaText, onCta }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      color: '#666'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
      <div style={{ fontSize: '18px', marginBottom: '24px' }}>{message}</div>
      {ctaText && (
        <button
          onClick={onCta}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {ctaText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;