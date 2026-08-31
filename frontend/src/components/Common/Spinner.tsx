import React from 'react';

interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
  center?: boolean;
}

export default function Spinner({
  size = 24,
  color = '#69717d',
  className = '',
  center = false,
}: SpinnerProps) {
  return (
    <div
      className={`spinner ${center ? 'center' : ''} ${className}`}
      style={
        {
          fontSize: `${size}px`,
          '--spinner-color': color,
        } as React.CSSProperties
      }
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="spinner-blade" />
      ))}
    </div>
  );
}
