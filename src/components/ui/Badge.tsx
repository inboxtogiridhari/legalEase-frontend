import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors';
  
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-800 border border-amber-100',
    error: 'bg-rose-50 text-rose-800 border border-rose-100',
    info: 'bg-blue-50 text-blue-800 border border-blue-100',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
