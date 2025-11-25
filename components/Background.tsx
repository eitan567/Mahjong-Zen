import React, { useState, useEffect } from 'react';

const THEMES = [
  {
    // Ocean & Sand (Shells vibe)
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop',
    alt: 'Ocean'
  },
  {
    // Tropical Forest
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1920&auto=format&fit=crop',
    alt: 'Forest'
  },
  {
    // Snowy Mountains
    url: 'https://images.unsplash.com/photo-1454447331282-b26fd8745094?q=80&w=1920&auto=format&fit=crop',
    alt: 'Mountain'
  },
  {
    // Zen Water/Stones
    url: 'https://images.unsplash.com/photo-1515096788709-a3cf4ce0a4a6?q=80&w=1920&auto=format&fit=crop',
    alt: 'Zen'
  }
];

export const Background: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % THEMES.length);
    }, 20000); // Change every 20 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full z-[-1] overflow-hidden bg-[#14532d]">
      {THEMES.map((theme, index) => (
        <div
          key={theme.url}
          className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-[3000ms] ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${theme.url})` }}
        />
      ))}

      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />

      {/* Green Tint Overlay to keep Mahjong Vibe */}
      <div className="absolute inset-0 bg-green-900/30 mix-blend-overlay" />

      {/* Felt Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
};