// components/ui/Button.tsx

import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', disabled, children, ...props }, ref) => {
    const baseStyles =
      'px-6 py-3 rounded-md font-medium tracking-wide transition-all duration-200 ' +
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 focus-visible:ring-offset-2 ' +
      'focus-visible:ring-offset-ivory';

    const variantStyles: Record<ButtonVariant, string> = {
      // Ebony body with a brass hairline: the instrument's own materials.
      primary:
        'bg-ink-900 text-ivory-50 shadow-card ring-1 ring-inset ring-brass-700/40 ' +
        'hover:bg-ink-800 hover:shadow-lift hover:ring-brass-500/60 ' +
        'active:translate-y-px active:shadow-card ' +
        'disabled:bg-ink-200 disabled:text-ink-400 disabled:ring-transparent ' +
        'disabled:shadow-none disabled:cursor-not-allowed disabled:hover:bg-ink-200',
      secondary:
        'bg-ivory-50 text-ink-700 ring-1 ring-inset ring-ink-200 shadow-card ' +
        'hover:text-ink-900 hover:ring-brass-400 hover:shadow-lift ' +
        'active:translate-y-px active:shadow-card ' +
        'disabled:text-ink-300 disabled:ring-ink-100 disabled:shadow-none ' +
        'disabled:cursor-not-allowed',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
