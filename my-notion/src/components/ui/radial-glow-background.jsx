import React, { useState } from "react";

export const RadialGlowBackground = ({ children }) => {
  const [count, setCount] = useState(0);

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#020617', // Dark slate background
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Dark Radial Glow Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 0,
          backgroundImage: `radial-gradient(circle 500px at 50% 200px, #3e3e3e, transparent)`,
        }}
      />
      
      {/* Content Layer */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
};
