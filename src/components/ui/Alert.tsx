import React from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
}

export function Alert({ variant = 'info', title, children, className = '', ...props }: AlertProps) {
  const base = 'rounded-lg p-4 flex gap-3 items-start';
  const variants: Record<string, string> = {
    info: 'bg-blue-50 text-blue-800 border border-blue-100',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-800 border border-amber-100',
    danger: 'bg-rose-50 text-rose-800 border border-rose-100',
  };

  const Icon = variant === 'success' ? CheckCircle : variant === 'warning' ? AlertTriangle : Info;

  return (
    <div className={`${base} ${variants[variant]} ${className}`} role="alert" {...props}>
      <div className="mt-1"><Icon className="w-5 h-5" /></div>
      <div className="flex-1">
        {title && <div className="font-semibold text-sm mb-1">{title}</div>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

export default Alert;
