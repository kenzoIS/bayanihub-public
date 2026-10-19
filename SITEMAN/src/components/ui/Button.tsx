import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = ({ 
  variant = 'primary', 
  icon, 
  children, 
  className,
  ...props 
}: ButtonProps) => {
  return (
    <button 
      className={cn(
        'btn',
        variant === 'primary' ? 'btn-primary' : 'btn-outline',
        icon ? 'btn-icon' : '',
        className
      )}
      {...props}
    >
      {icon && <span className="btn-icon-wrapper">{icon}</span>}
      {children}
    </button>
  );
};