'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ResponsiveTextProps {
  text: string;
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({ text, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const adjustFontSize = () => {
      if (!containerRef.current || !textRef.current) return;
      const container = containerRef.current;
      const textElement = textRef.current;
      const containerWidth = container.offsetWidth;
      let minSize = 16;
      let maxSize = containerWidth * 0.15;
      let testFontSize = Math.max(16, containerWidth * 0.08);
      for (let i = 0; i < 20; i++) {
        testFontSize = (minSize + maxSize) / 2;
        textElement.style.fontSize = `${testFontSize}px`;
        if (textElement.scrollWidth <= containerWidth) { minSize = testFontSize; } else { maxSize = testFontSize; }
        if (maxSize - minSize < 1) break;
      }
      setFontSize(minSize);
    };
    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <h2 ref={textRef} className={`text-neutral-900 leading-none whitespace-nowrap tracking-wider ${className}`} style={{ fontSize: `${fontSize}px` }}>
        {text}
      </h2>
    </div>
  );
};
