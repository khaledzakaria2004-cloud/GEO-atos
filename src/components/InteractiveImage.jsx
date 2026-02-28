import React, { useState, useRef, useEffect } from 'react';

const InteractiveImage = () => {
  const [imageStyle, setImageStyle] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const imageRef = useRef(null);

  // Enhanced global mouse tracking for more interactive effect
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!imageRef.current) return;
      
      // Get mouse position relative to viewport center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const deltaX = (e.clientX - centerX) / window.innerWidth;
      const deltaY = (e.clientY - centerY) / window.innerHeight;
      
      // More pronounced rotation for better interactivity
      const rotateX = deltaY * -12;
      const rotateY = deltaX * 12;
      const translateZ = isHovered ? 30 : 0;
      const scale = isHovered ? 1.05 : 1;
      
      setImageStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`,
        transition: isHovered ? 'transform 0.3s ease-out' : 'transform 0.15s ease-out'
      });
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isHovered]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className="relative w-full h-full max-w-lg mx-auto" style={{ perspective: '1000px' }}>
      <div 
        ref={imageRef}
        style={imageStyle}
        className="relative w-full"
      >
        <img 
          src="/assets/images/weekly_tasks.gif" 
          alt="ATOS fit App Interface" 
          className="w-1/2 h-auto object-cover cursor-pointer mx-auto block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Hover Overlay - Only shows on image hover
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-center items-center p-8 pointer-events-none">
            <div className="text-center transform transition-all duration-300 ease-out">
              <h3 className="text-[#FF8A00] text-2xl font-bold mb-4">Privacy-First Fitness</h3>
              <div className="space-y-3 text-white text-lg">
                <p>• Experience AI with complete privacy</p>
                <p>• AI form correction</p>
                <p>• ICP blockchain security</p>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default InteractiveImage;