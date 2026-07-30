'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
import styles from './HeadingSectionText.module.css';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface HeadingSectionTextProps {
    title?: string;
    breadcrumb?: BreadcrumbItem[];
}

export default function HeadingSectionText({
    title = 'Courses',
    breadcrumb = [
        { label: 'Home', href: '/' },
        { label: 'Courses' },
    ],
}: HeadingSectionTextProps) {
    const mousePos = useParallaxMouse();

    return (
        <div className={styles.hn_heading_section_text}>
            {/* Background Parallax Abstract Shapes */}
            <div className={styles.hn_heading_section_text__shape_wrapper}>
                <div className={styles.hn_heading_section_text__shape_1}>
                    <span />
                </div>
                <div className={styles.hn_heading_section_text__shape_2}>
                    <span />
                </div>

                {/* Shape 3: breadcrumb-shape-1.png (data-depth="2") */}
                <div className={styles.hn_heading_section_text__shape_3}>
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
                            src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/shapes/breadcrumb-shape-1.png"
                            alt="Breadcrumb Abstract Shape 1"
                            width={186}
                            height={186}
                        />
                    </span>
                </div>

                {/* Shape 4: breadcrumb-shape-2.png (data-depth="-2") */}
                <div className={styles.hn_heading_section_text__shape_4}>
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
                            src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/shapes/breadcrumb-shape-2.png"
                            alt="Breadcrumb Abstract Shape 2"
                            width={101}
                            height={39}
                        />
                    </span>
                </div>

                {/* Shape 5: breadcrumb-shape-3.png (data-depth="2") */}
                <div className={styles.hn_heading_section_text__shape_5}>
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
                            src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/shapes/breadcrumb-shape-3.png"
                            alt="Breadcrumb Abstract Shape 3"
                            width={123}
                            height={191}
                        />
                    </span>
                </div>
            </div>

            {/* Container */}
            <div className={styles.hn_heading_section_text__container}>
                {/* Page Title */}
                <div className={styles.hn_heading_section_text__page_title}>
                    <h1 className={styles.hn_heading_section_text__entry_title}>{title}</h1>
                </div>

                {/* Breadcrumb Navigation */}
                <div className={styles.hn_heading_section_text__breadcrumb_wrapper}>
                    <nav className={styles.hn_heading_section_text__breadcrumb_nav}>
                        <ul className={styles.hn_heading_section_text__breadcrumb}>
                            {breadcrumb.map((item, index) => {
                                const isLast = index === breadcrumb.length - 1;
                                return (
                                    <li key={index} className={styles.hn_heading_section_text__breadcrumb_item}>
                                        {item.href && !isLast ? (
                                            <Link href={item.href} className={styles.hn_heading_section_text__breadcrumb_link}>
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <span className={styles.hn_heading_section_text__breadcrumb_active}>
                                                {item.label}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
}
