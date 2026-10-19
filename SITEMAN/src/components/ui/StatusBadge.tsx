import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'online' | 'active' | 'standby';
  children: React.ReactNode;
}

export const StatusBadge = ({ status, children }: StatusBadgeProps) => {
  return (
    <span className={cn(
      'badge',
      status === 'online' && 'badge-success',
      status === 'active' && 'badge-info',
      status === 'standby' && 'badge-warning'
    )}>
      {children}
    </span>
  );
};