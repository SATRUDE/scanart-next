import React from 'react';

interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'h3-article' | 'lead';
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
}

// A string tag, not a component: mapped at module scope so the compiler can
// see no component is being created during render.
function tagFor(variant: string): keyof React.JSX.IntrinsicElements {
  if (variant === 'h3-article') return 'h3';
  return variant as keyof React.JSX.IntrinsicElements;
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

  // createElement with a string tag, because a capitalised variable in JSX
  // reads to the compiler as a component minted fresh every render, and it
  // cannot see that the "component" here is only ever 'h1' or 'p'.
  return React.createElement(
    tagFor(variant),
    { className: `${baseClasses[variant]} ${centered ? 'text-center' : ''} ${className}` },
    children,
  );
};

export default Typography; 