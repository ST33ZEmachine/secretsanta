import React from 'react';

interface PixelGiftProps {
  size?: number;
  className?: string;
}

const PixelGift: React.FC<PixelGiftProps> = ({ size = 32, className = '' }) => {
  return (
    <div 
      className={`pixel-icon ${className}`}
      style={{ 
        width: size, 
        height: size,
        imageRendering: 'pixelated' as any,
      }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 32 32"
        style={{ 
          imageRendering: 'pixelated' as any,
          imageRendering: '-moz-crisp-edges' as any,
          imageRendering: 'crisp-edges' as any,
        }}
      >
        {/* Gift box */}
        <rect x="6" y="12" width="20" height="14" fill="#dc2626"/>
        {/* Bow */}
        <rect x="13" y="4" width="6" height="14" fill="#16a34a"/>
        {/* Vertical ribbon */}
        <rect x="15" y="12" width="2" height="14" fill="#ffffff"/>
        {/* Horizontal ribbon */}
        <rect x="6" y="18" width="20" height="2" fill="#ffffff"/>
        {/* Bow center */}
        <circle cx="16" cy="8" r="2" fill="#ffd700"/>
        <circle cx="16" cy="10" r="2" fill="#ffd700"/>
      </svg>
    </div>
  );
};

export default PixelGift;



