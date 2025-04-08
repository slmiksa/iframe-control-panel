
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
        src="/lovable-uploads/a1aab481-0a1c-4ef9-8ca8-bb77381ea4a1.png" 
        alt="Iframe trindSky Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
};

export default Logo;
