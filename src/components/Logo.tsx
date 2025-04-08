
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'extra-large' | 'giant';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "medium" }) => {
  const sizeClasses = {
    small: "h-8",
    medium: "h-12",
    large: "h-32",
    'extra-large': "h-64 w-auto", 
    'giant': "h-96 w-full max-w-xl" // Very large size
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/lovable-uploads/6cd7b84f-949d-406e-b6d6-2389f9fd9f34.png" 
        alt="Iframe trindSky Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
};

export default Logo;
