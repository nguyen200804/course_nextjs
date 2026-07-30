'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './LazyLoad.module.css';

interface LazyLoadProps {
  children: React.ReactNode;
  animation?: 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'fade-in' | 'zoom-in' | string;
  animationDelay?: number; // Tốc độ trễ (đơn vị: ms, ví dụ: 100, 200, 500)
  duration?: number; // Thời gian chạy animation (đơn vị: ms, mặc định: 1000ms)
  className?: string;
  threshold?: number;
  once?: boolean;
}

export default function LazyLoad({
  children,
  animation = 'slide-up',
  animationDelay = 0,
  duration = 900,
  className = '',
  threshold = 0.15,
  once = true,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, once]);

  // Ánh xạ kiểu animation truyền vào tương ứng với CSS Class
  const getAnimClass = () => {
    switch (animation) {
      case 'slide-up':
      case 'edublink--slide-up':
        return styles.slide_up;
      case 'slide-down':
      case 'edublink--slide-down':
        return styles.slide_down;
      case 'slide-left':
      case 'edublink--slide-left':
        return styles.slide_left;
      case 'slide-right':
      case 'edublink--slide-right':
        return styles.slide_right;
      case 'fade-in':
      case 'fadeIn':
        return styles.fade_in;
      case 'zoom-in':
        return styles.zoom_in;
      default:
        return styles.slide_up;
    }
  };

  return (
    <div
      ref={ref}
      className={`${styles.lazyload} ${getAnimClass()} ${isVisible ? styles.visible : ''
        } ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${animationDelay}ms`,
      }}
    >
      {children}
    </div>
  );
}
