'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import LazyLoad from '../common/LazyLoad';
import styles from './Statistics.module.css';

// Import Odometer động phía Client
const Odometer = dynamic(() => import('react-odometerjs'), {
  ssr: false,
});

interface StatItem {
  id: number;
  targetValue: number;
  format: string;
  suffix: string;
  title: string;
  themeClass: string;
  delay: number;
}

const statsData: StatItem[] = [
  {
    id: 1,
    targetValue: 29.3,
    format: '(,ddd).d',
    suffix: 'K',
    title: 'STUDENT ENROLLED',
    themeClass: styles.theme_teal,
    delay: 50,
  },
  {
    id: 2,
    targetValue: 32.4,
    format: '(,ddd).d',
    suffix: 'K',
    title: 'CLASS COMPLETED',
    themeClass: styles.theme_pink,
    delay: 100,
  },
  {
    id: 3,
    targetValue: 100,
    format: '(,ddd)',
    suffix: '%',
    title: 'SATISFACTION RATE',
    themeClass: styles.theme_purple,
    delay: 150,
  },
  {
    id: 4,
    targetValue: 354,
    format: '(,ddd)',
    suffix: '+',
    title: 'TOP INSTRUCTORS',
    themeClass: styles.theme_orange,
    delay: 200,
  },
];

function StatCard({ stat }: { stat: StatItem }) {
  const [value, setValue] = useState<number>(stat.targetValue);
  const [mounted, setMounted] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
    // Khi Client vừa load, đặt số về 0 để chuẩn bị chạy animation Odometer
    setValue(0);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          // Độ trễ nhỏ 100ms đảm bảo DOM Odometer đã sẵn sàng cuộn số từ 0 lên targetValue
          setTimeout(() => {
            setValue(stat.targetValue);
          }, 100);
        }
      },
      { threshold: 0.15 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [mounted, stat.targetValue]);

  return (
    <LazyLoad
      animation="slide-up"
      animationDelay={stat.delay}
      className={`${styles.hn_statistics__column} ${stat.themeClass}`}
    >
      <div ref={cardRef} className={styles.hn_statistics__widget_wrap}>
        {/* Counterup Widget */}
        <div className={styles.hn_statistics__counter_widget}>
          <div className={styles.hn_statistics__widget_container}>
            <div className={styles.hn_statistics__counter_item}>
              <span className={styles.hn_statistics__odometer}>
                {mounted ? (
                  <Odometer value={value} format={stat.format} duration={2000} />
                ) : (
                  /* Giúp Googlebot & Search Engine Crawlers đọc được con số thực tế ngay trên SSR HTML */
                  <span>{stat.targetValue}</span>
                )}
              </span>
              <span className={styles.hn_statistics__counter_suffix}>{stat.suffix}</span>
            </div>
          </div>
        </div>

        {/* Heading Widget */}
        <div className={styles.hn_statistics__heading_widget}>
          <div className={styles.hn_statistics__widget_container}>
            <h6 className={styles.hn_statistics__heading_title}>{stat.title}</h6>
          </div>
        </div>
      </div>
    </LazyLoad>
  );
}

export default function Statistics() {
  return (
    <section className={styles.hn_statistics}>
      <div className={styles.hn_statistics__container}>
        {statsData.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>
    </section>
  );
}
