'use client';

import Image from 'next/image';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
import LazyLoad from '../common/LazyLoad';
import styles from './AboutSection.module.css';

export default function AboutSection() {
    const mousePos = useParallaxMouse();

    return (
        <section className={styles.hn_about_section}>
            <div className={styles.hn_about_section__container}>

                {/* LEFT COLUMN: Heading & Checkmark List */}
                <div className={styles.hn_about_section__column_left}>
                    <div className={styles.hn_about_section__widget_wrap}>

                        {/* Yellow Circle Color Dot (data-depth="0"): fadeIn, delay 500 */}
                        <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_about_section__color_shape}>
                            <span data-depth="0" style={{ display: 'block' }}>
                                <span className={styles.hn_about_section__color_dot} />
                            </span>
                        </LazyLoad>

                        {/* Section Heading Widget: slide-up, delay 150 */}
                        <LazyLoad animation="slide-up" animationDelay={150} className={styles.hn_about_section__heading_widget}>
                            <div className={styles.hn_about_section__heading_container}>
                                <span className={styles.hn_about_section__pre_heading}>ABOUT US</span>
                                <h2 className={styles.hn_about_section__heading}>
                                    We Providing The <mark className={styles.hn_about_section__mark}>Best Quality</mark> Online Courses.
                                </h2>
                                <div className={styles.hn_about_section__title_shape}>
                                    <i className="icon-19"></i>
                                </div>
                                <div className={styles.hn_about_section__sub_heading}>
                                    Lorem ipsum dolor sit amet consectur adipiscing elit sed eiusmod ex tempor incididunt labore dolore magna aliquaenim ad minim.
                                </div>
                            </div>
                        </LazyLoad>

                        {/* Icon List Widget (Checkmarks): slide-up, delay 250 */}
                        <LazyLoad animation="slide-up" animationDelay={250} className={styles.hn_about_section__list_widget}>
                            <ul className={styles.hn_about_section__list}>
                                <li className={styles.hn_about_section__list_item}>
                                    <span className={styles.hn_about_section__list_icon}>
                                        <i aria-hidden="true" className="icon-20"></i>
                                    </span>
                                    <span className={styles.hn_about_section__list_text}>Flexible Classes</span>
                                </li>
                                <li className={styles.hn_about_section__list_item}>
                                    <span className={styles.hn_about_section__list_icon}>
                                        <i aria-hidden="true" className="icon-20"></i>
                                    </span>
                                    <span className={styles.hn_about_section__list_text}>Offline Classe Mode</span>
                                </li>
                                <li className={styles.hn_about_section__list_item}>
                                    <span className={styles.hn_about_section__list_icon}>
                                        <i aria-hidden="true" className="icon-20"></i>
                                    </span>
                                    <span className={styles.hn_about_section__list_text}>Educator Support</span>
                                </li>
                            </ul>
                        </LazyLoad>

                    </div>
                </div>

                {/* RIGHT COLUMN: Gallery & Parallax Shapes */}
                <div className={styles.hn_about_section__column_right}>
                    <div className={styles.hn_about_section__widget_wrap}>

                        {/* Shape 38 (data-depth="2"): fadeIn, delay 500 */}
                        <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_about_section__shape_1}>
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
                                    src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-38.png"
                                    alt="About Shape 4"
                                    width={210}
                                    height={193}
                                />
                            </span>
                        </LazyLoad>

                        {/* Shape 37 (data-depth="-2"): fadeIn, delay 500 */}
                        <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_about_section__shape_2}>
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
                                    src="https://demo.edublink.co/wp-content/uploads/2023/07/shape-37.png"
                                    alt="About-Shape-2"
                                    width={174}
                                    height={174}
                                />
                            </span>
                        </LazyLoad>

                        {/* Shape 02 (data-depth=""): fadeIn, delay 500 - Khong co mouse tracking */}
                        <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_about_section__shape_3}>
                            <span data-depth="" style={{ display: 'block' }}>
                                <Image
                                    src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-02.png"
                                    alt="Hero-Shape-18"
                                    width={159}
                                    height={175}
                                />
                            </span>
                        </LazyLoad>

                        {/* Shape 04-2 (data-depth="-1.8"): fadeIn, delay 500 */}
                        <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_about_section__shape_4}>
                            <span
                                data-depth="-1.8"
                                style={{
                                    transform: `translate3d(${mousePos.x * 1.8}px, ${mousePos.y * 1.8}px, 0px) rotate(0.0001deg)`,
                                    transformStyle: 'preserve-3d',
                                    backfaceVisibility: 'hidden',
                                    display: 'block',
                                }}
                            >
                                <Image
                                    src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-04-2.png"
                                    alt="About Shape 5"
                                    width={273}
                                    height={259}
                                />
                            </span>
                        </LazyLoad>

                        {/* Top-right Overlay Image (about-12.webp): slide-down, delay 150 */}
                        <LazyLoad animation="slide-down" animationDelay={150} className={styles.hn_about_section__image_overlay}>
                            <Image
                                src="https://demo.edublink.co/wp-content/uploads/2023/07/about-12.webp"
                                alt="About Guy with Glasses"
                                width={220}
                                height={270}
                                className={styles.hn_about_section__overlay_img}
                            />
                        </LazyLoad>

                        {/* Main Image (about-11.webp): slide-down, delay 50 */}
                        <LazyLoad animation="slide-down" animationDelay={50} className={styles.hn_about_section__main_image_widget}>
                            <Image
                                src="https://demo.edublink.co/wp-content/uploads/2023/07/about-11.webp"
                                alt="About Students Learning"
                                width={520}
                                height={370}
                                className={styles.hn_about_section__main_img}
                            />
                        </LazyLoad>

                    </div>
                </div>

            </div>
        </section>
    );
}
