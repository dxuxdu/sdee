import { HTMLAttributes, forwardRef, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'featured';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, style, ...props }, ref) => {
    const baseStyles = 'rounded-xl border transition-all duration-300';

    const variantStyles: Record<string, CSSProperties> = {
      default: {
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
      },
      hover: {
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--accent)',
        boxShadow: '0 0 20px rgba(var(--accent-rgb), 0.1)',
      },
      featured: {
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--accent)',
        boxShadow: '0 10px 15px -3px rgba(var(--accent-rgb), 0.05)',
      },
    };

    return (
      <div 
        ref={ref} 
        className={cn(baseStyles, className)} 
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };

// Card Header
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pb-4', className)} {...props} />;
}

// Card Content
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

// Card Footer
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-4', className)} {...props} />;
}
