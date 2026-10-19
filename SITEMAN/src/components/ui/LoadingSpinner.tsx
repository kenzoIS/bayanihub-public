import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  text?: string;
}

export const LoadingSpinner = ({ 
  size = 24, 
  color = 'var(--color-primary)', 
  text 
}: LoadingSpinnerProps) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '12px',
      padding: '20px'
    }}>
      <div 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: `3px solid ${color}20`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {text && (
        <span style={{ 
          color: 'var(--color-gray-500)', 
          fontSize: '14px',
          fontWeight: 500
        }}>
          {text}
        </span>
      )}
    </div>
  );
};