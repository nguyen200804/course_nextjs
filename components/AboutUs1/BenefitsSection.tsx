'use client';

import Image from 'next/image';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
import LazyLoad from '../common/LazyLoad';
import styles from './BenefitsSection.module.css';

export default function BenefitsSection() {
    const mousePos = useParallaxMouse();

    return (
        <section className={styles.hn_benefits_section}>
            {/* Bottom Tilt SVG Shape Divider */}
            <div className={styles.hn_benefits_section__shape_divider}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none">
                    <path className={styles.hn_benefits_section__shape_fill} d="M0,6V0h1000v100L0,6z" />
                </svg>
            </div>

            {/* Decorative Parallax Background Shapes */}
            {/* Shape 13 (data-depth="-2"): fadeIn, delay 500 */}
            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_benefits_section__shape_1}>
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

            {/* Shape 40 (data-depth="2"): fadeIn, delay 500 */}
            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_benefits_section__shape_2}>
                <span
                    data-depth="2"
                    style={{
                        transform: `translate3d(${mousePos.x * -2}px, ${mousePos.y * -2}px, 0px) rotate(0.0001deg)`,
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                        display: 'block',
                    }}
                >
                    <Image
                        src="https://demo.edublink.co/wp-content/uploads/2023/07/shape-40.png"
                        alt="shape-40"
                        width={140}
                        height={140}
                    />
                </span>
            </LazyLoad>

            {/* Color Shape 1 (data-depth="-1"): fadeIn, delay 500 */}
            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_benefits_section__color_shape_1}>
                <span
                    data-depth="-1"
                    style={{
                        transform: `translate3d(${mousePos.x * 1}px, ${mousePos.y * 1}px, 0px) rotate(0.0001deg)`,
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                        display: 'block',
                    }}
                >
                    <span className="edublink-animation-widget-color" />
                </span>
            </LazyLoad>

            {/* Color Shape 2 (data-depth=""): fadeIn, delay 500 - No Mouse Parallax */}
            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_benefits_section__color_shape_2}>
                <span data-depth="" style={{ display: 'block' }}>
                    <span className={styles.hn_benefits_section__yellow_ring} />
                </span>
            </LazyLoad>

            {/* Main Content Container */}
            <div className={styles.hn_benefits_section__container}>
                
                {/* Section Header */}
                <div className={styles.hn_benefits_section__header}>
                    <LazyLoad animation="slide-up" animationDelay={150} className={styles.hn_benefits_section__heading_widget}>
                        <span className={styles.hn_benefits_section__pre_heading}>WHY CHOOSE EDUBLINK</span>
                        <h2 className={styles.hn_benefits_section__heading}>
                            The Best <mark className={styles.hn_benefits_section__mark}>Beneficial</mark> Side <br />
                            of EduBlink
                        </h2>
                        <div className={styles.hn_benefits_section__title_shape}>
                            <i className="icon-19"></i>
                        </div>
                    </LazyLoad>
                </div>

                {/* 3 Feature Cards Grid */}
                <div className={styles.hn_benefits_section__grid}>
                    
                    {/* Card 1: High Quality Courses */}
                    <LazyLoad animation="slide-up" animationDelay={50} className={styles.hn_benefits_section__card}>
                        <div className={styles.hn_benefits_section__card_inner}>
                            <div className={`${styles.hn_benefits_section__card_icon} ${styles.icon_badge_green}`}>
                                <i aria-hidden="true" className="icon-45" />
                            </div>
                            <h3 className={styles.hn_benefits_section__card_title}>High Quality Courses</h3>
                            <div className={styles.hn_benefits_section__card_details}>
                                <p className={styles.hn_benefits_section__card_text}>
                                    Lorem ipsum dolor sit amet conset ur elit sed eiusmod ex tempor inc labore dolore magna.
                                </p>
                            </div>
                        </div>
                    </LazyLoad>

                    {/* Card 2: Life Time Access */}
                    <LazyLoad animation="slide-up" animationDelay={100} className={styles.hn_benefits_section__card}>
                        <div className={styles.hn_benefits_section__card_inner}>
                            <div className={`${styles.hn_benefits_section__card_icon} ${styles.icon_badge_pink}`}>
                                <i aria-hidden="true" className="icon-46" />
                            </div>
                            <h3 className={styles.hn_benefits_section__card_title}>Life Time Access</h3>
                            <div className={styles.hn_benefits_section__card_details}>
                                <p className={styles.hn_benefits_section__card_text}>
                                    Lorem ipsum dolor sit amet conset ur elit sed eiusmod ex tempor inc labore dolore magna.
                                </p>
                            </div>
                        </div>
                    </LazyLoad>

                    {/* Card 3: Expert Instructors */}
                    <LazyLoad animation="slide-up" animationDelay={150} className={styles.hn_benefits_section__card}>
                        <div className={styles.hn_benefits_section__card_inner}>
                            <div className={`${styles.hn_benefits_section__card_icon} ${styles.icon_badge_blue}`}>
                                <i aria-hidden="true" className="icon-47" />
                            </div>
                            <h3 className={styles.hn_benefits_section__card_title}>Expert Instructors</h3>
                            <div className={styles.hn_benefits_section__card_details}>
                                <p className={styles.hn_benefits_section__card_text}>
                                    Lorem ipsum dolor sit amet conset ur elit sed eiusmod ex tempor inc labore dolore magna.
                                </p>
                            </div>
                        </div>
                    </LazyLoad>

                </div>

            </div>
        </section>
    );
}
