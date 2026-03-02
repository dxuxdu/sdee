import { ButtonHTMLAttributes, forwardRef, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, style, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]';

    const variantStyles: Record<string, CSSProperties> = {
      primary: {
        background: 'linear-gradient(to right, var(--accent), var(--accent-hover))',
        color: 'var(--text-primary)',
        boxShadow: '0 10px 15px -3px rgba(var(--accent-rgb), 0.2)',
      },
      secondary: {
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
      },
      outline: {
        backgroundColor: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--text-muted)',
      },
    };

    const sizes = {
      sm: 'text-sm px-3 py-1.5',
      md: 'text-sm px-4 py-2.5',
      lg: 'text-base px-6 py-3',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, sizes[size], className)}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
