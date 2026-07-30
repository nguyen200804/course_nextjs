'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
import LazyLoad from '../common/LazyLoad';
import styles from './Instructors.module.css';

interface InstructorItem {
    id: number;
    name: string;
    designation: string;
    description: string;
    avatar: string;
    delay: number;
}

const instructorsData: InstructorItem[] = [
    {
        id: 1,
        name: 'Jane Seymour',
        designation: 'UI Designer',
        description: 'Consectetur adipisicing elit, sed do eius mod tempor incididunt',
        avatar: 'https://demo.edublink.co/wp-content/uploads/2023/06/team-01.webp',
        delay: 100,
    },
    {
        id: 2,
        name: 'Edward Norton',
        designation: 'UI Designer',
        description: 'Consectetur adipisicing elit, sed do eius mod tempor incididunt',
        avatar: 'https://demo.edublink.co/wp-content/uploads/2023/06/team-02.webp',
        delay: 200,
    },
    {
        id: 3,
        name: 'Penelope Cruz',
        designation: 'UI Designer',
        description: 'Consectetur adipisicing elit, sed do eius mod tempor incididunt',
        avatar: 'https://demo.edublink.co/wp-content/uploads/2023/06/team-03.webp',
        delay: 300,
    },
];

export default function Instructors() {
    const mousePos = useParallaxMouse();

    return (
        <section className={styles.hn_instructors}>
            {/* Background Parallax Shapes */}
            {/* Shape 1: Color Dot Grid (data-depth="0.8") */}
            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_instructors__shape_1}>
                <span
                    data-depth="0.8"
                    style={{
                        transform: `translate3d(${mousePos.x * -0.8}px, ${mousePos.y * -0.8}px, 0px) rotate(0.0001deg)`,
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                        display: 'block',
                    }}
                >
                    <span className="edublink-animation-widget-color" />
                </span>
            </LazyLoad>

            {/* Shape 2: Color Dot Grid (data-depth="") - No Mouse Tracking */}
            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_instructors__shape_2}>
                <span data-depth="" style={{ display: 'block' }}>
                    <span className="edublink-animation-widget-color" />
                </span>
            </LazyLoad>

            {/* Shape 3: Shape 13 (data-depth="-2") */}
            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_instructors__shape_3}>
                <span
                    data-depth="-2"
                    style={{
                        transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0px) rotate(0.0001deg)`,
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                        display: 'block',
                    }}
                >
                    <Image
                        src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-13.png"
                        alt="Hero-Shape-1"
                        width={130}
                        height={130}
                    />
                </span>
            </LazyLoad>

            {/* Main Content Container */}
            <div className={styles.hn_instructors__container}>
                {/* Section Header */}
                <div className={styles.hn_instructors__header}>
                    <LazyLoad animation="slide-up" animationDelay={150} className={styles.hn_instructors__heading_widget}>
                        <span className={styles.hn_instructors__pre_heading}>INSTRUCTORS</span>
                        <h2 className={styles.hn_instructors__heading}>Course Instructors</h2>
                        <div className={styles.hn_instructors__title_shape}>
                            <i className="icon-19"></i>
                        </div>
                    </LazyLoad>
                </div>

                {/* Instructors Grid */}
                <div className={styles.hn_instructors__grid}>
                    {instructorsData.map((item) => (
                        <LazyLoad
                            key={item.id}
                            animation="slide-up"
                            animationDelay={item.delay}
                            className={styles.hn_instructors__card}
                        >
                            <div className={styles.hn_instructors__item}>
                                {/* Thumbnail Wrap with Hover Social Info */}
                                <div className={styles.hn_instructors__thumbnail_wrap}>
                                    <div className={styles.hn_instructors__thumbnail}>
                                        <Image
                                            src={item.avatar}
                                            alt={item.name}
                                            width={370}
                                            height={370}
                                            className={styles.hn_instructors__avatar}
                                        />
                                    </div>
                                    <ul className={styles.hn_instructors__share_info}>
                                        <li>
                                            <a href="#" target="_blank" rel="noopener noreferrer" className={styles.hn_instructors__share_link}>
                                                <i className="icon-facebook" />
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" target="_blank" rel="noopener noreferrer" className={styles.hn_instructors__share_link}>
                                                <i className="icon-twitter" />
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" target="_blank" rel="noopener noreferrer" className={styles.hn_instructors__share_link}>
                                                <i className="icon-linkedin2" />
                                            </a>
                                        </li>
                                    </ul>
                                </div>

                                {/* Content Details */}
                                <div className={styles.hn_instructors__content}>
                                    <h3 className={styles.hn_instructors__name}>
                                        <a href="#" className={styles.hn_instructors__name_link}>
                                            {item.name}
                                        </a>
                                    </h3>
                                    <span className={styles.hn_instructors__designation}>{item.designation}</span>
                                    <p className={styles.hn_instructors__description}>{item.description}</p>
                                </div>
                            </div>
                        </LazyLoad>
                    ))}
                </div>
            </div>
        </section>
    );
}
