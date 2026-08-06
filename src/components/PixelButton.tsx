import React from 'react';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'orange' | 'celeste' | 'yellow' | 'green' | 'danger' | 'wood' | 'golden';
  size?: 'sm' | 'md' | 'lg';
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  children,
  variant = 'orange',
  size = 'md',
  className = '',
  ...props
}) => {
  const variantClass = `pixel-btn-${variant}`;
  const sizeClass = size !== 'md' ? `pixel-btn-${size}` : '';

  return (
    <button
      className={`pixel-btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
