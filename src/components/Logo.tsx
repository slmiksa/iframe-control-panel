
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "medium" }) => {
  const sizeClasses = {
    small: "h-8",
    medium: "h-12",
    large: "h-32"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/lovable-uploads/0fb95d37-50b2-4574-b928-315bdb0248fa.png" 
        alt="Iframe trindSky Logo" 
        className={`${sizeClasses[size]}`}
      />
    </div>
  );
};

export default Logo;
