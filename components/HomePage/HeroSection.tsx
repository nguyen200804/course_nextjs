'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
import ButtonGreen from '../common/ButtonGreen';
import LazyLoad from '../common/LazyLoad';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const mousePos = useParallaxMouse();

  return (
    <section className={styles.hn_hero_section}>
      <div className={styles.hn_hero_section__background_overlay}></div>
      <Image src="/images/banner_background_bottom.svg" width={1920} height={1080} className={styles.hn_hero_section__background_image} alt="Hero background bottom" />
      <div className={styles.hn_hero_section__container}>

        {/* Column Left (Content: Heading, Text, Button) */}
        <div className={styles.hn_hero_section__column_left}>
          <div className={styles.hn_hero_section__widget_wrap}>

            {/* Heading Widget: edublink--slide-up, delay 100 */}
            <LazyLoad animation="slide-up" animationDelay={100}>
              <div className={styles.hn_hero_section__heading_widget}>
                <div className={styles.hn_hero_section__widget_container}>
                  <h1 className={styles.hn_hero_section__heading_title}>
                    The Best <br />
                    Program to <span className={styles.hn_hero_section__color_secondary}>Enroll</span> for Exchange
                  </h1>
                </div>
              </div>
            </LazyLoad>

            {/* Text Editor Widget: edublink--slide-up, delay 200 */}
            <LazyLoad animation="slide-up" animationDelay={200}>
              <div className={styles.hn_hero_section__text_widget}>
                <div className={styles.hn_hero_section__widget_container}>
                  <p className={styles.hn_hero_section__description}>
                    Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit.
                  </p>
                </div>
              </div>
            </LazyLoad>

            {/* Button Widget: edublink--slide-up, delay 400 */}
            <LazyLoad animation="slide-up" animationDelay={400}>
              <div className={styles.hn_hero_section__button_widget}>
                <div className={styles.hn_hero_section__widget_container}>
                  <div className={styles.hn_hero_section__button_wrapper}>
                    <ButtonGreen text="Find courses" href="/courses" className={styles.hn_hero_section__button_item} />
                  </div>
                </div>
              </div>
            </LazyLoad>

          </div>
        </div>

        {/* Column Right (Inner Section: Images, Shapes, Support Card) */}
        <div className={styles.hn_hero_section__column_right}>
          <div className={styles.hn_hero_section__widget_wrap}>

            <section className={styles.hn_hero_section__inner_section}>
              <div className={styles.hn_hero_section__inner_container}>

                {/* Inner Column Left */}
                <div className={styles.hn_hero_section__inner_column_left}>
                  <div className={styles.hn_hero_section__inner_widget_wrap_left}>

                    {/* Shape 13-1 (data-depth="2"): fadeIn, delay 1000 */}
                    <LazyLoad animation="fade-in" animationDelay={1000} className={styles.hn_hero_section__shape_widget_1}>
                      <div className={styles.hn_hero_section__widget_container}>
                        <div className={styles.hn_hero_section__animation_widget}>
                          <span
                            className={styles.hn_hero_section__animation_span}
                            data-depth="2"
                            style={{
                              transform: `translate3d(${mousePos.x * -2}px, ${mousePos.y * -2}px, 0px) rotate(0.0001deg)`,
                              transformStyle: 'preserve-3d',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <Image
                              src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-13-1.png"
                              alt="Hero Shape 5"
                              width={162}
                              height={118}
                              className={styles.hn_hero_section__shape_image}
                            />
                          </span>
                        </div>
                      </div>
                    </LazyLoad>

                    {/* Online Support Widget: edublink--slide-right, delay 600 */}
                    <LazyLoad animation="slide-right" animationDelay={600} className={styles.hn_hero_section__support_widget}>
                      <div className={styles.hn_hero_section__widget_container}>
                        <div className={styles.hn_hero_section__online_support}>
                          <div className={styles.hn_hero_section__support_wrapper}>
                            <div className={styles.hn_hero_section__support_icon}>
                              <i className="icon-29"></i>
                            </div>
                            <div className={styles.hn_hero_section__support_content}>
                              <span className={styles.hn_hero_section__support_subtitle}>Online Support</span>
                              <h4 className={styles.hn_hero_section__support_title}>
                                <Link href="tel:+0123456789">+012 (345) 6789</Link>
                              </h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </LazyLoad>

                    {/* Shape 04-1 (data-depth="-2"): fadeIn, delay 1000 */}
                    <LazyLoad animation="fade-in" animationDelay={1000} className={styles.hn_hero_section__shape_widget_2}>
                      <div className={styles.hn_hero_section__widget_container}>
                        <div className={styles.hn_hero_section__animation_widget}>
                          <span
                            className={styles.hn_hero_section__animation_span}
                            data-depth="-2"
                            style={{
                              transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0px) rotate(0.0001deg)`,
                              transformStyle: 'preserve-3d',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <Image
                              src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-04-1.png"
                              alt="Hero Shape 7"
                              width={106}
                              height={106}
                              className={styles.hn_hero_section__shape_image}
                            />
                          </span>
                        </div>
                      </div>
                    </LazyLoad>

                    {/* Girl Image Widget: edublink--slide-up, delay 500 */}
                    <LazyLoad animation="slide-up" animationDelay={500} className={styles.hn_hero_section__girl_image_widget}>
                      <div className={styles.hn_hero_section__widget_container}>
                        <Image
                          src="https://demo.edublink.co/wp-content/uploads/2023/05/girl-2.webp"
                          alt="Girl Student"
                          width={270}
                          height={300}
                          className={styles.hn_hero_section__girl_image}
                        />
                      </div>
                    </LazyLoad>

                  </div>
                </div>

                {/* Inner Column Right */}
                <div className={styles.hn_hero_section__inner_column_right}>
                  <div className={styles.hn_hero_section__inner_widget_wrap_right}>

                    {/* Shape 12-1 (data-depth="-2"): fadeIn, delay 1000 */}
                    <LazyLoad animation="fade-in" animationDelay={1000} className={styles.hn_hero_section__shape_widget_3}>
                      <div className={styles.hn_hero_section__widget_container}>
                        <div className={styles.hn_hero_section__animation_widget}>
                          <span
                            className={styles.hn_hero_section__animation_span}
                            data-depth="-2"
                            style={{
                              transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0px) rotate(0.0001deg)`,
                              transformStyle: 'preserve-3d',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <Image
                              src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-12-1.png"
                              alt="Hero Shape 6"
                              width={110}
                              height={110}
                              className={styles.hn_hero_section__shape_image}
                            />
                          </span>
                        </div>
                      </div>
                    </LazyLoad>

                    {/* Shape 09 (data-depth="2"): fadeIn, delay 1000 */}
                    <LazyLoad animation="fade-in" animationDelay={1000} className={styles.hn_hero_section__shape_widget_4}>
                      <div className={styles.hn_hero_section__widget_container}>
                        <div className={styles.hn_hero_section__animation_widget}>
                          <span
                            className={styles.hn_hero_section__animation_span}
                            data-depth="2"
                            style={{
                              transform: `translate3d(${mousePos.x * -2}px, ${mousePos.y * -2}px, 0px) rotate(0.0001deg)`,
                              transformStyle: 'preserve-3d',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <Image
                              src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-09.png"
                              alt="Hero Shape 10"
                              width={85}
                              height={37}
                              className={styles.hn_hero_section__shape_image}
                            />
                          </span>
                        </div>
                      </div>
                    </LazyLoad>

                    {/* Man Image Widget: edublink--slide-down, delay 500 */}
                    <LazyLoad animation="slide-down" animationDelay={500} className={styles.hn_hero_section__man_image_widget}>
                      <div className={styles.hn_hero_section__widget_container}>
                        <Image
                          src="https://demo.edublink.co/wp-content/uploads/2023/05/man-1.webp"
                          alt="Man Student"
                          width={240}
                          height={370}
                          className={styles.hn_hero_section__man_image}
                        />
                      </div>
                    </LazyLoad>

                  </div>
                </div>

              </div>
            </section>

          </div>
        </div>

      </div>
    </section>
  );
}
