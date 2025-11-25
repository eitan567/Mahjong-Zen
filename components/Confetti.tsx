
import React, { useEffect, useRef } from 'react';

export const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Particle configuration
    const colors = ['#fbbf24', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ffffff'];
    const particleCount = 150;
    const particles: any[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rspeed: (Math.random() - 0.5) * 10,
        oscillation: Math.random() * 20,
        oscillationSpeed: Math.random() * 0.05 + 0.01
      });
    }

    let animationId: number;
    let tick = 0;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tick += 0.05;

      particles.forEach(p => {
        // Update physics
        p.y += p.vy;
        p.x += p.vx + Math.sin(tick * p.oscillationSpeed) * 1; // Add some sway
        p.rotation += p.rspeed;
        
        // Gravity/Acceleration simulation
        p.vy += 0.02; 

        // Reset if out of bounds
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
          p.vy = Math.random() * 3 + 2;
          p.vx = (Math.random() - 0.5) * 3;
        }

        // Draw confetti piece
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        
        ctx.fillStyle = p.color;
        // Draw a slightly irregular rectangle for paper look
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.2);
        
        ctx.restore();
      });

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-40" />;
};
