import React from 'react';

interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'h3-article' | 'lead';
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
}

export const Typography: React.FC<TypographyProps> = ({ 
  variant, 
  children, 
  className = '',
  centered = false
}) => {
  const baseClasses = {
    h1: 'text-3xl md:text-4xl leading-tight text-neutral-900 tracking-tight',
    h2: 'text-2xl tracking-tight text-neutral-900',
    h3: 'text-base leading-[25px] text-[rgb(113,113,130)] font-normal',
    'h3-article': 'text-lg tracking-tight font-normal group-hover:text-muted-foreground transition-colors',
    lead: 'text-lg leading-7 text-[rgb(113,113,130)] font-normal',
  };

  const getComponent = (variant: string) => {
    if (variant === 'h3-article') return 'h3';
    return variant as keyof React.JSX.IntrinsicElements;
  };
  
  const Component = getComponent(variant);
  
  return (
    <Component className={`${baseClasses[variant]} ${centered ? 'text-center' : ''} ${className}`}>
      {children}
    </Component>
  );
};

export default Typography; 