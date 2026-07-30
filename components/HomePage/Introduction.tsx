'use client';

import Image from 'next/image';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
import LazyLoad from '../common/LazyLoad';
import styles from './Introduction.module.css';

export default function Introduction() {
  const mousePos = useParallaxMouse();

  return (
    <section className={styles.homenest__intro__section}>
      <div className={styles.homenest__intro__container}>
        {/* Left Column */}
        <div className={styles.homenest__intro__column_left}>
          <div className={styles.homenest__intro__widget_wrap}>
            
            {/* Shape 1 (data-depth="2"): fadeIn, delay 500 */}
            <LazyLoad animation="fade-in" animationDelay={500} className={`${styles.homenest__intro__shape_1} ${styles.homenest__intro__widget}`}>
              <div className={styles.homenest__intro__widget_container}>
                <div className={styles.homenest__intro__animation_widget}>
                  <span
                    data-depth="2"
                    className={styles.homenest__intro__shape_span}
                    style={{
                      transform: `translate3d(${mousePos.x * -2}px, ${mousePos.y * -2}px, 0px) rotate(0.0001deg)`,
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <Image
                      src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-38.png"
                      alt="About Shape 4"
                      width={210}
                      height={193}
                    />
                  </span>
                </div>
              </div>
            </LazyLoad>

            {/* Shape 2 (data-depth="-2"): fadeIn, delay 500 */}
            <LazyLoad animation="fade-in" animationDelay={500} className={`${styles.homenest__intro__shape_2} ${styles.homenest__intro__widget}`}>
              <div className={styles.homenest__intro__widget_container}>
                <div className={styles.homenest__intro__animation_widget}>
                  <span
                    data-depth="-2"
                    className={styles.homenest__intro__shape_span}
                    style={{
                      transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0px) rotate(0.0001deg)`,
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

            {/* Shape 3 (data-depth="1.8"): fadeIn, delay 500 */}
            <LazyLoad animation="fade-in" animationDelay={500} className={`${styles.homenest__intro__shape_3} ${styles.homenest__intro__widget}`}>
              <div className={styles.homenest__intro__widget_container}>
                <div className={styles.homenest__intro__animation_widget}>
                  <span
                    data-depth="1.8"
                    className={styles.homenest__intro__shape_span}
                    style={{
                      transform: `translate3d(${mousePos.x * -1.8}px, ${mousePos.y * -1.8}px, 0px) rotate(0.0001deg)`,
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <Image
                      src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-04-2.png"
                      alt="About Shape 5"
                      width={273}
                      height={259}
                    />
                  </span>
                </div>
              </div>
            </LazyLoad>

            {/* Icon Box: Learners */}
            <div className={`${styles.homenest__intro__learners_box} ${styles.homenest__intro__widget}`}>
              <div className={styles.homenest__intro__widget_container}>
                <div className={styles.homenest__intro__icon_box_wrapper_left}>
                  <div className={styles.homenest__intro__icon_box_icon_enable}></div>
                  <div className={styles.homenest__intro__icon_box_content}>
                    <h6 className={styles.homenest__intro__icon_box_title}>20K+</h6>
                    <div className={styles.homenest__intro__icon_box_details}>
                      <p>Enrolled Learners</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Icon Box: Instructor */}
            <div className={`${styles.homenest__intro__instructor_box} ${styles.homenest__intro__widget}`}>
              <div className={styles.homenest__intro__widget_container}>
                <div className={styles.homenest__intro__icon_box_wrapper_top}>
                  <div className={styles.homenest__intro__icon_box_icon_disable}>
                    <Image
                      src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-03.png"
                      alt="shape-03"
                      width={90}
                      height={90}
                    />
                  </div>
                  <div className={styles.homenest__intro__icon_box_content}>
                    <h4 className={styles.homenest__intro__icon_box_title}>Ray Sanchez</h4>
                    <div className={styles.homenest__intro__icon_box_details}>
                      <p>
                        Minim veniam nostrud <br />
                        exer citation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Featured Image */}
            <div className={`${styles.homenest__intro__main_image_box} ${styles.homenest__intro__widget}`}>
              <div className={styles.homenest__intro__widget_container}>
                <Image
                  src="https://demo.edublink.co/wp-content/uploads/2023/05/about-03.webp"
                  alt="About Us"
                  width={520}
                  height={370}
                  priority
                />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column */}
        <div className={styles.homenest__intro__column_right}>
          <div className={styles.homenest__intro__widget_wrap}>
            
            {/* Color Dot Animation (data-depth="-2.3"): fadeIn, delay 500 */}
            <LazyLoad animation="fade-in" animationDelay={500} className={`${styles.homenest__intro__color_box} ${styles.homenest__intro__widget}`}>
              <div className={styles.homenest__intro__widget_container}>
                <div className={styles.homenest__intro__animation_widget}>
                  <span
                    data-depth="-2.3"
                    className={styles.homenest__intro__shape_span}
                    style={{
                      transform: `translate3d(${mousePos.x * 2.3}px, ${mousePos.y * 2.3}px, 0px) rotate(0.0001deg)`,
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <span className={styles.homenest__intro__color_dot}></span>
                  </span>
                </div>
              </div>
            </LazyLoad>

            {/* Section Heading: edublink--slide-up, delay 100 */}
            <LazyLoad animation="slide-up" animationDelay={100} className={`${styles.homenest__intro__heading_box} ${styles.homenest__intro__widget}`}>
              <div className={styles.homenest__intro__widget_container}>
                <div className={styles.homenest__intro__section_heading}>
                  <span className={styles.homenest__intro__pre_heading}>ABOUT US</span>
                  <h3 className={styles.homenest__intro__heading}>
                    Over 10 Years in <mark>Distant learning</mark> for Skill Development
                  </h3>
                  <div className={styles.homenest__intro__title_shape}>
                    <i className="icon-19"></i>
                  </div>
                  <div className={styles.homenest__intro__sub_heading}>
                    Lorem ipsum dolor sit amet consectur adipiscing elit sed eiusmod ex tempor incididunt labore dolore magna aliquaenim ad minim.
                  </div>
                </div>
              </div>
            </LazyLoad>

            {/* Icon List: edublink--slide-up, delay 150 */}
            <LazyLoad animation="slide-up" animationDelay={150} className={`${styles.homenest__intro__list_box} ${styles.homenest__intro__widget}`}>
              <div className={styles.homenest__intro__widget_container}>
                <ul className={styles.homenest__intro__list_items}>
                  <li className={styles.homenest__intro__list_item}>
                    <span className={styles.homenest__intro__list_icon}>
                      <i aria-hidden="true" className="edublink icon-20"></i>
                    </span>
                    <span className={styles.homenest__intro__list_text}>Expert Trainers</span>
                  </li>
                  <li className={styles.homenest__intro__list_item}>
                    <span className={styles.homenest__intro__list_icon}>
                      <i aria-hidden="true" className="edublink icon-20"></i>
                    </span>
                    <span className={styles.homenest__intro__list_text}>Online Remote Learning</span>
                  </li>
                  <li className={styles.homenest__intro__list_item}>
                    <span className={styles.homenest__intro__list_icon}>
                      <i aria-hidden="true" className="edublink icon-20"></i>
                    </span>
                    <span className={styles.homenest__intro__list_text}>Lifetime Access</span>
                  </li>
                </ul>
              </div>
            </LazyLoad>

          </div>
        </div>

      </div>
    </section>
  );
}
