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
      // A black key seen from above: polished ebony lit from the top edge,
      // and pressing it sinks it like a key under a finger.
      primary:
        'text-ivory-50 bg-gradient-to-b from-ink-600 via-ink-800 to-ink-900 ' +
        '[box-shadow:inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(58,52,48,0.25),0_10px_22px_-10px_rgba(21,19,18,0.55)] ' +
        'hover:from-ink-500 hover:via-ink-700 hover:to-ink-900 ' +
        'active:translate-y-[2px] active:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.12),0_1px_2px_rgba(58,52,48,0.25)] ' +
        'disabled:bg-none disabled:bg-ink-200 disabled:text-ink-400 ' +
        'disabled:[box-shadow:none] disabled:cursor-not-allowed disabled:active:translate-y-0',
      // Ghost: text and a hairline border on the bare page, present without
      // asking for attention.
      secondary:
        'bg-transparent text-ink-600 ring-1 ring-inset ring-ink-300 ' +
        'hover:text-ink-900 hover:ring-ink-500 hover:bg-ink-900/[0.03] ' +
        'active:translate-y-px ' +
        'disabled:text-ink-300 disabled:ring-ink-100 disabled:cursor-not-allowed',
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
