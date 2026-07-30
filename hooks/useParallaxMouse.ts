'use client';

import { useState, useEffect, useRef } from 'react';

export function useParallaxMouse(multiplier: number = 15, friction: number = 0.08) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = ((clientX - innerWidth / 2) / (innerWidth / 2)) * multiplier;
      const y = ((clientY - innerHeight / 2) / (innerHeight / 2)) * multiplier;
      targetPos.current = { x, y };
    };

    const animate = () => {
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * friction;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * friction;

      setMousePos({
        x: currentPos.current.x,
        y: currentPos.current.y,
      });

      animFrameId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [multiplier, friction]);

  return mousePos;
}
