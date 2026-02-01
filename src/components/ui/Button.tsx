// components/ui/Button.tsx

import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', disabled, children, ...props }, ref) => {
    const baseStyles =
      'px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-300',
      secondary:
        'bg-transparent border-2 border-gray-400 text-gray-700 hover:border-gray-600 hover:text-gray-900 focus:ring-gray-500 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed',
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
