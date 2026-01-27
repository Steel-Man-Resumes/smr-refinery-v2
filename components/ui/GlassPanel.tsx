import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  chrome?: boolean;
}

export default function GlassPanel({ children, className = '', chrome = false }: GlassPanelProps) {
  const baseClasses = chrome ? 'chrome-border' : 'glass-panel';

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
}
