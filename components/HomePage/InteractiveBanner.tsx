'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
import LazyLoad from '../common/LazyLoad';
import styles from './InteractiveBanner.module.css';

export default function InteractiveBanner() {
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const mousePos = useParallaxMouse();

    return (
        <>
            <section className={styles.hn_interactive_banner}>
                <div className={styles.hn_interactive_banner__container}>
                    <div className={styles.hn_interactive_banner__column}>
                        <div className={styles.hn_interactive_banner__widget_wrap}>

                            {/* Shape 1 (data-depth="2"): fadeIn */}
                            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_interactive_banner__shape_1}>
                                <div className={styles.hn_interactive_banner__widget_container}>
                                    <div className={styles.hn_interactive_banner__animation_widget}>
                                        <span
                                            data-depth="2"
                                            className={styles.hn_interactive_banner__shape_span}
                                            style={{
                                                transform: `translate3d(${mousePos.x * -2}px, ${mousePos.y * -2}px, 0px) rotate(0.0001deg)`,
                                                transformStyle: 'preserve-3d',
                                                backfaceVisibility: 'hidden',
                                            }}
                                        >
                                            <Image
                                                src="https://demo.edublink.co/wp-content/uploads/2023/07/shape-37.png"
                                                alt="About-Shape-2"
                                                width={174}
                                                height={174}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </LazyLoad>

                            {/* Shape 2 (data-depth="-2"): fadeIn */}
                            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_interactive_banner__shape_2}>
                                <div className={styles.hn_interactive_banner__widget_container}>
                                    <div className={styles.hn_interactive_banner__animation_widget}>
                                        <span
                                            data-depth="-2"
                                            className={styles.hn_interactive_banner__shape_span}
                                            style={{
                                                transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0px) rotate(0.0001deg)`,
                                                transformStyle: 'preserve-3d',
                                                backfaceVisibility: 'hidden',
                                            }}
                                        >
                                            <Image
                                                src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-02.png"
                                                alt="Hero-Shape-18"
                                                width={159}
                                                height={175}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </LazyLoad>

                            {/* Shape 3 (data-depth="-2"): fadeIn */}
                            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_interactive_banner__shape_3}>
                                <div className={styles.hn_interactive_banner__widget_container}>
                                    <div className={styles.hn_interactive_banner__animation_widget}>
                                        <span
                                            data-depth="-2"
                                            className={styles.hn_interactive_banner__shape_span}
                                            style={{
                                                transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0px) rotate(0.0001deg)`,
                                                transformStyle: 'preserve-3d',
                                                backfaceVisibility: 'hidden',
                                            }}
                                        >
                                            <Image
                                                src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-14.png"
                                                alt="shape-14"
                                                width={162}
                                                height={118}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </LazyLoad>

                            {/* Video Popup Widget: edublink--slide-up, delay 150 */}
                            <LazyLoad animation="slide-up" animationDelay={150} className={styles.hn_interactive_banner__video_widget}>
                                <div className={styles.hn_interactive_banner__video_widget_container}>
                                    <div className={styles.hn_interactive_banner__video_wrapper}>

                                        {/* Background Banner Image */}
                                        <Image
                                            src="https://demo.edublink.co/wp-content/uploads/2023/05/video-01.webp"
                                            alt="Interactive Video Banner"
                                            width={890}
                                            height={500}
                                            className={styles.hn_interactive_banner__video_thumb}
                                            priority
                                        />

                                        {/* Play Button Overlay */}
                                        <div className={styles.hn_interactive_banner__video_content}>
                                            <button
                                                type="button"
                                                className={styles.hn_interactive_banner__video_icon}
                                                onClick={() => setIsVideoOpen(true)}
                                                aria-label="Play Video"
                                            >
                                                <i aria-hidden="true" className="icon-18"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </LazyLoad>

                        </div>
                    </div>
                </div>
            </section>

            {/* Video Popup Modal */}
            {isVideoOpen && (
                <div
                    className={styles.hn_interactive_banner__modal_overlay}
                    onClick={() => setIsVideoOpen(false)}
                >
                    <div
                        className={styles.hn_interactive_banner__modal_container}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className={styles.hn_interactive_banner__modal_close}
                            onClick={() => setIsVideoOpen(false)}
                            aria-label="Close Modal"
                        >
                            &times;
                        </button>
                        <div className={styles.hn_interactive_banner__iframe_wrapper}>
                            <iframe
                                src="https://www.youtube.com/embed/m2m5Xx5T4No?autoplay=1"
                                title="YouTube Video Player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
