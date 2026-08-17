import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {label}
            </label>
        )}
        <input
          ref={ref}
          className={`flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-navy/20 focus-visible:border-court-navy disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? 'border-rose-500 focus-visible:ring-rose-500/20 focus-visible:border-rose-500' : 'border-slate-200'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id || props.name}-error` : undefined}
          {...props}
        />
        {error && <p id={`${props.id || props.name}-error`} className="mt-1.5 text-sm text-rose-500">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
