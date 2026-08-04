'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HeadingSectionText from '@/components/common/HeadingSectionText';
import styles from '@/styles/NotFoundContent.module.css';

export default function NotFoundPage() {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    // Calculate normalized offset (-1 to 1)
    const x = (clientX - centerX) / centerX;
    const y = (clientY - centerY) / centerY;
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  return (
    <main>
      <HeadingSectionText
        title="404 - Error not found"
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Error 404' },
        ]}
      />

      <section
        className={styles.hn_not_found_section}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.hn_not_found_container}>
          <div className={styles.hn_not_found_error_box}>
            <div className={styles.hn_not_found_thumbnail}>
              <Image
                src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/error/404.png"
                alt="404 Error"
                width={598}
                height={286}
                unoptimized
                className={styles.hn_not_found_main_img}
              />
              <ul className={styles.hn_not_found_shape_group_inner}>
                <li className={`${styles.hn_not_found_shape_item} ${styles.hn_not_found_shape_1}`}>
                  <span
                    className={styles.hn_not_found_shape_span}
                    style={{
                      transform: `translate3d(${mouseOffset.x * 25}px, ${mouseOffset.y * 25}px, 0px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <Image
                      src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/error/shape-25.png"
                      alt="Shape"
                      width={186}
                      height={186}
                      unoptimized
                    />
                  </span>
                </li>
                <li className={`${styles.hn_not_found_shape_item} ${styles.hn_not_found_shape_2}`}>
                  <span
                    className={styles.hn_not_found_shape_span}
                    style={{
                      transform: `translate3d(${mouseOffset.x * -20}px, ${mouseOffset.y * -20}px, 0px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <Image
                      src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/error/shape-15.png"
                      alt="Shape"
                      width={101}
                      height={39}
                      unoptimized
                    />
                  </span>
                </li>
                <li className={`${styles.hn_not_found_shape_item} ${styles.hn_not_found_shape_3}`}>
                  <span
                    className={styles.hn_not_found_shape_span}
                    style={{
                      transform: `translate3d(${mouseOffset.x * 30}px, ${mouseOffset.y * 30}px, 0px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <Image
                      src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/error/shape-13.png"
                      alt="Shape"
                      width={186}
                      height={186}
                      unoptimized
                    />
                  </span>
                </li>
                <li className={`${styles.hn_not_found_shape_item} ${styles.hn_not_found_shape_4}`}>
                  <span
                    className={styles.hn_not_found_shape_span}
                    style={{
                      transform: `translate3d(${mouseOffset.x * -25}px, ${mouseOffset.y * -25}px, 0px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <Image
                      src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/error/shape-02.png"
                      alt="Shape"
                      width={159}
                      height={175}
                      unoptimized
                    />
                  </span>
                </li>
              </ul>
            </div>

            <div className={styles.hn_not_found_content}>
              <h2 className={styles.hn_not_found_title}>404 - Page Not Found</h2>
              <h4 className={styles.hn_not_found_subtitle}>The page you are looking for does not exist.</h4>
              <Link href="/" className={styles.hn_not_found_btn}>
                <i className="ri-arrow-left-line"></i>
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
        <ul className={styles.hn_not_found_shape_group_outer}>
          <li className={styles.hn_not_found_bg_shape}>
            <Image
              src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/error/map-shape-2.png"
              alt="Shape"
              width={660}
              height={220}
              unoptimized
            />
          </li>
        </ul>
      </section>
    </main>
  );
}
