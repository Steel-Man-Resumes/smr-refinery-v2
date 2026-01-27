import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  animated?: boolean;
  className?: string;
}

export default function ProgressBar({
  progress,
  animated = true,
  className = ''
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`progress-bar ${className}`}>
      <div
        className={`progress-bar-fill ${animated ? 'pulse-glow' : ''}`}
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
}
