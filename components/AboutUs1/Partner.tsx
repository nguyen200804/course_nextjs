'use client';

import Image from 'next/image';
import LazyLoad from '../common/LazyLoad';
import styles from './Partner.module.css';

const brandLogos = [
    { id: 1, src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-01.png', alt: 'Brand 01' },
    { id: 2, src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-02.png', alt: 'Brand 02' },
    { id: 3, src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-03.png', alt: 'Brand 03' },
    { id: 4, src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-04.png', alt: 'Brand 04' },
    { id: 5, src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-05.png', alt: 'Brand 05' },
    { id: 6, src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-06.png', alt: 'Brand 06' },
];

export default function Partner() {
    return (
        <section className={styles.hn_partner}>
            <div className={styles.hn_partner__container}>
                {brandLogos.map((brand, index) => (
                    <LazyLoad
                        key={brand.id}
                        animation="slide-up"
                        animationDelay={(index + 1) * 50}
                        className={styles.hn_partner__column}
                    >
                        <div className={styles.hn_partner__widget_wrap}>
                            <div className={styles.hn_partner__image_widget}>
                                <div className={styles.hn_partner__widget_container}>
                                    <Image
                                        src={brand.src}
                                        alt={brand.alt}
                                        width={120}
                                        height={120}
                                        className={styles.hn_partner__brand_logo}
                                    />
                                </div>
                            </div>
                        </div>
                    </LazyLoad>
                ))}
            </div>
        </section>
    );
}
