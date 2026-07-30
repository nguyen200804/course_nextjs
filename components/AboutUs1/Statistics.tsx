'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import LazyLoad from '../common/LazyLoad';
import styles from './Statistics.module.css';

// Import Odometer dynamically for SSR compatibility
const Odometer = dynamic(() => import('react-odometerjs'), {
    ssr: false,
});

interface StatItem {
    id: number;
    targetValue: number;
    format: string;
    suffix: string;
    title: string;
    iconClass: string;
    badgeStyle: string;
    delay: number;
}

const statsData: StatItem[] = [
    {
        id: 1,
        targetValue: 29.3,
        format: '(,ddd).d',
        suffix: 'K',
        title: 'STUDENT ENROLLED',
        iconClass: 'icon-48',
        badgeStyle: styles.icon_badge_green,
        delay: 50,
    },
    {
        id: 2,
        targetValue: 32.4,
        format: '(,ddd).d',
        suffix: 'K',
        title: 'CLASS COMPLETED',
        iconClass: 'icon-47',
        badgeStyle: styles.icon_badge_pink,
        delay: 100,
    },
    {
        id: 3,
        targetValue: 100,
        format: '(,ddd)',
        suffix: '%',
        title: 'SATISFACTION RATE',
        iconClass: 'icon-49',
        badgeStyle: styles.icon_badge_blue,
        delay: 150,
    },
    {
        id: 4,
        targetValue: 354,
        format: '(,ddd)',
        suffix: '+',
        title: 'TOP INSTRUCTORS',
        iconClass: 'icon-50',
        badgeStyle: styles.icon_badge_yellow,
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
        setValue(0);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimatedRef.current) {
                    hasAnimatedRef.current = true;
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
            className={styles.hn_statistics__column}
        >
            <div ref={cardRef} className={styles.hn_statistics__card_inner}>
                {/* Icon Badge */}
                <div className={`${styles.hn_statistics__icon_wrap} ${stat.badgeStyle}`}>
                    <i aria-hidden="true" className={stat.iconClass} />
                </div>

                {/* Counter Value */}
                <div className={styles.hn_statistics__counter_wrap}>
                    <span className={styles.hn_statistics__number}>
                        {mounted ? (
                            <Odometer value={value} format={stat.format} duration={2000} />
                        ) : (
                            <span>{stat.targetValue}</span>
                        )}
                    </span>
                    <span className={styles.hn_statistics__suffix}>{stat.suffix}</span>
                </div>

                {/* Label Title */}
                <h6 className={styles.hn_statistics__title}>{stat.title}</h6>
            </div>
        </LazyLoad>
    );
}

export default function Statistics() {
    return (
        <section className={styles.hn_statistics}>
            {/* Background Map Image Shape */}
            <div className={styles.hn_statistics__map_wrapper}>
                <Image
                    src="https://demo.edublink.co/wp-content/uploads/2023/06/map-shape-3.png"
                    alt="Map Background Shape"
                    width={698}
                    height={659}
                    className={styles.hn_statistics__map_img}
                />
            </div>

            {/* Container Grid */}
            <div className={styles.hn_statistics__container}>
                <div className={styles.hn_statistics__grid}>
                    {statsData.map((stat) => (
                        <StatCard key={stat.id} stat={stat} />
                    ))}
                </div>
            </div>
        </section>
    );
}
