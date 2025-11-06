import React from 'react';

interface PixelIconProps {
  name: 'gift' | 'santa' | 'tree' | 'snowflake' | 'star' | 'heart' | 'person';
  size?: number;
  color?: string;
  className?: string;
  variant?: number; // For person icon variations
}

const PixelIcon: React.FC<PixelIconProps> = ({ name, size = 24, color = '#dc2626', className = '', variant = 0 }) => {
  const generatePersonIcon = () => {
    // Hair color variations
    const hairColors = ['#8b4513', '#000000', '#ffd700', '#dc2626', '#4a5568', '#ff6b6b'];
    const skinTones = ['#ffdbac', '#f4c2a1', '#e8c39e', '#d4a574', '#c68642'];
    const hairColor = hairColors[variant % hairColors.length];
    const skinTone = skinTones[Math.floor(variant / hairColors.length) % skinTones.length];
    
    // Different hair styles and slight feature variations
    const hairStyles = [
      // Style 0: Standard
      `<rect x="4" y="1" width="8" height="3" fill="${hairColor}"/><rect x="4" y="2" width="2" height="2" fill="${hairColor}"/><rect x="10" y="2" width="2" height="2" fill="${hairColor}"/>`,
      // Style 1: Side part
      `<rect x="4" y="1" width="8" height="3" fill="${hairColor}"/><rect x="4" y="2" width="3" height="2" fill="${hairColor}"/><rect x="9" y="2" width="3" height="2" fill="${hairColor}"/>`,
      // Style 2: Spiky
      `<rect x="4" y="1" width="8" height="3" fill="${hairColor}"/><rect x="5" y="0" width="2" height="2" fill="${hairColor}"/><rect x="9" y="0" width="2" height="2" fill="${hairColor}"/><rect x="4" y="2" width="2" height="1" fill="${hairColor}"/><rect x="10" y="2" width="2" height="1" fill="${hairColor}"/>`,
      // Style 3: Curly
      `<rect x="4" y="1" width="8" height="3" fill="${hairColor}"/><rect x="4" y="1" width="3" height="2" fill="${hairColor}"/><rect x="9" y="1" width="3" height="2" fill="${hairColor}"/><rect x="6" y="0" width="2" height="2" fill="${hairColor}"/>`,
      // Style 4: Bangs
      `<rect x="4" y="1" width="8" height="3" fill="${hairColor}"/><rect x="5" y="2" width="6" height="2" fill="${hairColor}"/><rect x="4" y="2" width="1" height="1" fill="${hairColor}"/><rect x="11" y="2" width="1" height="1" fill="${hairColor}"/>`,
      // Style 5: Short
      `<rect x="5" y="1" width="6" height="2" fill="${hairColor}"/><rect x="4" y="2" width="2" height="1" fill="${hairColor}"/><rect x="10" y="2" width="2" height="1" fill="${hairColor}"/>`
    ];
    
    const hairStyle = hairStyles[variant % hairStyles.length];
    const eyeOffset = variant % 2 === 0 ? 0 : 0.5;
    const mouthStyle = variant % 3 === 0 ? 'smile' : variant % 3 === 1 ? 'neutral' : 'small';
    
    let mouth = '';
    if (mouthStyle === 'smile') {
      mouth = `<rect x="6" y="6" width="4" height="1" fill="#000"/><rect x="7" y="7" width="2" height="1" fill="#000"/>`;
    } else if (mouthStyle === 'small') {
      mouth = `<rect x="7" y="6" width="2" height="1" fill="#000"/>`;
    } else {
      mouth = `<rect x="7" y="6" width="2" height="1" fill="#000"/>`;
    }
    
    return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;">
      <!-- Head -->
      <rect x="5" y="2" width="6" height="6" fill="${skinTone}"/>
      <!-- Hair -->
      ${hairStyle}
      <!-- Eyes -->
      <rect x="${6 + eyeOffset}" y="4" width="1" height="1" fill="#000"/>
      <rect x="${9 + eyeOffset}" y="4" width="1" height="1" fill="#000"/>
      <!-- Mouth -->
      ${mouth}
      <!-- Body -->
      <rect x="5" y="8" width="6" height="5" fill="${color}"/>
      <!-- Arms -->
      <rect x="3" y="9" width="2" height="3" fill="${color}"/>
      <rect x="11" y="9" width="2" height="3" fill="${color}"/>
      <!-- Legs -->
      <rect x="6" y="13" width="2" height="3" fill="#1f2937"/>
      <rect x="8" y="13" width="2" height="3" fill="#1f2937"/>
    </svg>`;
  };

  const icons: Record<string, string> = {
    gift: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;">
      <rect x="4" y="6" width="16" height="12" fill="${color}"/>
      <rect x="10" y="6" width="4" height="12" fill="white"/>
      <rect x="4" y="10" width="16" height="4" fill="white"/>
      <rect x="10" y="2" width="4" height="8" fill="${color}"/>
    </svg>`,
    santa: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;">
      <circle cx="12" cy="8" r="4" fill="#ffd700"/>
      <rect x="8" y="10" width="8" height="6" fill="${color}"/>
      <rect x="10" y="14" width="4" height="8" fill="#1f2937"/>
      <rect x="6" y="10" width="2" height="4" fill="${color}"/>
      <rect x="16" y="10" width="2" height="4" fill="${color}"/>
    </svg>`,
    tree: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;">
      <rect x="10" y="18" width="4" height="6" fill="#92400e"/>
      <polygon points="12,2 6,10 12,10 8,16 12,16 16,10 18,10" fill="#16a34a"/>
      <polygon points="12,6 8,12 12,12 10,16 12,16 14,12 16,12" fill="#15803d"/>
      <circle cx="12" cy="8" r="1" fill="#ffd700"/>
      <circle cx="9" cy="12" r="1" fill="#dc2626"/>
      <circle cx="15" cy="12" r="1" fill="#dc2626"/>
    </svg>`,
    snowflake: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;">
      <rect x="11" y="2" width="2" height="20" fill="${color}"/>
      <rect x="2" y="11" width="20" height="2" fill="${color}"/>
      <rect x="5" y="5" width="2" height="2" transform="rotate(45 6 6)" fill="${color}"/>
      <rect x="17" y="17" width="2" height="2" transform="rotate(45 18 18)" fill="${color}"/>
      <rect x="17" y="5" width="2" height="2" transform="rotate(-45 18 6)" fill="${color}"/>
      <rect x="5" y="17" width="2" height="2" transform="rotate(-45 6 18)" fill="${color}"/>
    </svg>`,
    star: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;">
      <polygon points="12,2 14,8 20,8 15,12 17,18 12,14 7,18 9,12 4,8 10,8" fill="#ffd700"/>
    </svg>`,
    heart: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;">
      <path d="M12 4 C10 2 6 4 6 8 C6 12 12 18 12 18 C12 18 18 12 18 8 C18 4 14 2 12 4 Z" fill="${color}"/>
    </svg>`,
    person: generatePersonIcon()
  };

  return (
    <span 
      className={`inline-block pixel-icon ${className}`}
      dangerouslySetInnerHTML={{ __html: icons[name] }}
      style={{ 
        width: size, 
        height: size,
        display: 'inline-block'
      }}
    />
  );
};

export default PixelIcon;

