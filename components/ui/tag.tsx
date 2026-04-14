import * as React from "react";
import { cn } from "./utils";

interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium",
          // Size variants
          {
            'px-2 py-1 text-xs': size === 'sm',
            'px-3 py-1.5 text-xs': size === 'md',
            'px-4 py-2 text-sm': size === 'lg',
          },
          // Variant styles
          {
            'border border-neutral-200 rounded-full bg-white/80 backdrop-blur-sm text-neutral-600 tracking-wide uppercase': variant === 'default',
            'border border-border rounded-full bg-background text-foreground': variant === 'outline',
            'border border-secondary rounded-full bg-secondary text-secondary-foreground': variant === 'secondary',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Tag.displayName = "Tag";

export { Tag }; 