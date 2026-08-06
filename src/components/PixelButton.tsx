import React from 'react';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'wood' | 'golden' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  variant = 'green',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const variantClass = `pixel-btn-${variant}`;
  const sizeClass = size === 'md' ? '' : `pixel-btn-${size}`;
  
  return (
    <button
      className={`pixel-btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
