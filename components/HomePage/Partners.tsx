'use client';

import Image from 'next/image';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
import LazyLoad from '../common/LazyLoad';
import styles from './Partners.module.css';

const brandLogos = [
  {
    id: 1,
    src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-01.png',
    alt: 'Brand 01',
    shape: 'https://demo.edublink.co/wp-content/uploads/2023/07/shape-37.png',
    depth: -2,
  },
  { id: 2, src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-02.png', alt: 'Brand 02' },
  { id: 3, src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-03.png', alt: 'Brand 03' },
  { id: 4, src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-04.png', alt: 'Brand 04' },
  { id: 5, src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-05.png', alt: 'Brand 05' },
  {
    id: 6,
    src: 'https://demo.edublink.co/wp-content/uploads/2023/05/brand-06.png',
    alt: 'Brand 06',
    shape: 'https://demo.edublink.co/wp-content/uploads/2023/05/shape-41.png',
    depth: -2,
  },
];

export default function Partners() {
  const mousePos = useParallaxMouse();

  return (
    <section className={styles.hn_partners}>
      <div className={styles.hn_partners__container}>
        {brandLogos.map((brand, index) => (
          <LazyLoad
            key={brand.id}
            animation="slide-up"
            animationDelay={(index + 1) * 50}
            className={styles.hn_partners__column}
          >
            <div className={styles.hn_partners__widget_wrap}>

              {/* Optional Decorative Shape */}
              {brand.shape && (
                <div
                  className={`${styles.hn_partners__animation_widget} ${index === 0 ? styles.hn_partners__animation_widget_left : styles.hn_partners__animation_widget_right
                    }`}
                >
                  <div className={styles.hn_partners__animation_container}>
                    <div className={styles.hn_partners__animation_inner}>
                      <span
                        data-depth={brand.depth || 2}
                        className={styles.hn_partners__animation_span}
                        style={{
                          transform: `translate3d(${mousePos.x * -(brand.depth || 2)}px, ${mousePos.y * -(brand.depth || 2)}px, 0px) rotate(0.0001deg)`,
                          transformStyle: 'preserve-3d',
                          backfaceVisibility: 'hidden',
                        }}
                      >
                        <Image
                          src={brand.shape}
                          alt="shape"
                          width={index === 0 ? 150 : 180}
                          height={index === 0 ? 150 : 180}
                          className={styles.hn_partners__shape_image}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Brand Image Widget */}
              <div className={styles.hn_partners__image_widget}>
                <div className={styles.hn_partners__widget_container}>
                  <Image
                    src={brand.src}
                    alt={brand.alt}
                    width={120}
                    height={120}
                    className={styles.hn_partners__brand_logo}
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
