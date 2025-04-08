
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'extra-large' | 'giant' | 'control-panel';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "medium" }) => {
  const sizeClasses = {
    small: "h-8",
    medium: "h-12",
    large: "h-32",
    'extra-large': "h-64 w-auto", 
    'giant': "h-96 w-full max-w-xl",
    'control-panel': "h-24 w-auto" // Size specifically for control panel
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/lovable-uploads/75d2a6e6-e500-4ac0-9461-ec50a2a11230.png" 
        alt="Iframe trindSky Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
};

export default Logo;
