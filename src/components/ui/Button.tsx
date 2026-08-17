import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ' +
      'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

    const variants: Record<string, string> = {
      primary:     'bg-brand-600 text-white hover:bg-brand-700 shadow-soft',
      secondary:   'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-card',
      outline:     'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-brand-300',
      ghost:       'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-card',
      // 'accent' is kept as an alias for primary so existing usages don't break
      accent:      'bg-brand-600 text-white hover:bg-brand-700 shadow-soft',
    };

    const sizes: Record<string, string> = {
      sm: 'h-8 px-3 text-xs rounded-lg',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
