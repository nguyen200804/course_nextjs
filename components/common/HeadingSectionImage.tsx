import Image from 'next/image';
import Link from 'next/link';
import styles from './HeadingSectionImage.module.css';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface HeadingSectionImageProps {
    title?: string;
    breadcrumb?: BreadcrumbItem[];
    imageBackground?: string;
    bgImage?: string;
}

export default function HeadingSectionImage({
    title = 'A Large Range of Course Learning Paths',
    breadcrumb = [
        { label: 'Home', href: '/' },
        { label: 'About Us 1' },
    ],
    imageBackground,
    bgImage,
}: HeadingSectionImageProps) {
    const backgroundUrl =
        imageBackground ||
        bgImage ||
        'https://demo.edublink.co/wp-content/themes/edublink/assets/images/edublink-breadcrumb-bg.webp';

    return (
        <div className={styles.hn_heading_section_image}>
            {/* Optimized Next.js Background Image for LCP & FCP */}
            <Image
                src={backgroundUrl}
                alt={title}
                fill
                priority
                sizes="100vw"
                className={styles.hn_heading_section_image__bg}
            />

            <div className={styles.hn_heading_section_image__container}>
                {/* Page Title */}
                <div className={styles.hn_heading_section_image__page_title}>
                    <h1 className={styles.hn_heading_section_image__entry_title}>{title}</h1>
                </div>

                {/* Breadcrumb Navigation */}
                <div className={styles.hn_heading_section_image__breadcrumb_wrapper}>
                    <nav className={styles.hn_heading_section_image__breadcrumb_nav}>
                        <ul className={styles.hn_heading_section_image__breadcrumb}>
                            {breadcrumb.map((item, index) => {
                                const isLast = index === breadcrumb.length - 1;
                                return (
                                    <li key={index} className={styles.hn_heading_section_image__breadcrumb_item}>
                                        {item.href && !isLast ? (
                                            <Link href={item.href} className={styles.hn_heading_section_image__breadcrumb_link}>
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <span className={styles.hn_heading_section_image__breadcrumb_active}>
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
