
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'extra-large';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "medium" }) => {
  const sizeClasses = {
    small: "h-8",
    medium: "h-12",
    large: "h-32",
    'extra-large': "h-64 w-auto" // Much larger size
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/lovable-uploads/73870564-a97a-4690-a87c-8a7a1319e174.png" 
        alt="Iframe trindSky Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
};

export default Logo;
