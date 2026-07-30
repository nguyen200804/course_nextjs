'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
import LazyLoad from '../common/LazyLoad';
import styles from './AccordionSection.module.css';

const faqItems = [
  {
    id: 1,
    question: 'How can I contact a school directly?',
    answer:
      'Lorem ipsum dolor sit amet consectur adipiscing elit sed eius mod ex tempor incididunt labore dolore magna aliquaenim ad minim eniam.',
  },
  {
    id: 2,
    question: 'How do I find a school where I want to study?',
    answer:
      'Lorem ipsum dolor sit amet consectur adipiscing elit sed eius mod ex tempor incididunt labore dolore magna aliquaenim ad minim eniam.',
  },
  {
    id: 3,
    question: 'Where should I study abroad?',
    answer:
      'Lorem ipsum dolor sit amet consectur adipiscing elit sed eius mod ex tempor incididunt labore dolore magna aliquaenim ad minim eniam.',
  },
];

export default function AccordionSection() {
  const [openIndex, setOpenIndex] = useState<number>(0);
  const mousePos = useParallaxMouse();

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className={styles.hn_accordion}>
      <div className={styles.hn_accordion__container}>

        {/* Left Column: Image Gallery & Shapes */}
        <div className={styles.hn_accordion__column_left}>
          <div className={styles.hn_accordion__widget_wrap}>

            {/* Inner Section 1 */}
            <section className={styles.hn_accordion__inner_section_1}>
              <div className={styles.hn_accordion__inner_container_1}>

                <div className={styles.hn_accordion__inner_column_left_1}>
                  <div className={styles.hn_accordion__inner_widget_wrap_1}>
                    {/* Image 1: slide-right, delay 50 */}
                    <LazyLoad animation="slide-right" animationDelay={50} className={styles.hn_accordion__image_widget_1}>
                      <div className={styles.hn_accordion__widget_container}>
                        <Image
                          src="https://demo.edublink.co/wp-content/uploads/2023/06/faq-01.jpg"
                          alt="FAQ 01"
                          width={220}
                          height={280}
                          className={styles.hn_accordion__image_1}
                        />
                      </div>
                    </LazyLoad>
                  </div>
                </div>

                <div className={styles.hn_accordion__inner_column_right_1}>
                  <div className={styles.hn_accordion__inner_widget_wrap_2}>

                    {/* Shape 03 (data-depth="-2"): fadeIn */}
                    <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_accordion__shape_widget_1}>
                      <div className={styles.hn_accordion__widget_container}>
                        <div className={styles.hn_accordion__animation_widget}>
                          <span
                            data-depth="-2"
                            className={styles.hn_accordion__animation_span}
                            style={{
                              transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0px) rotate(0.0001deg)`,
                              transformStyle: 'preserve-3d',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <Image
                              src="https://demo.edublink.co/wp-content/uploads/2023/06/shape-03.png"
                              alt="shape-03"
                              width={123}
                              height={191}
                            />
                          </span>
                        </div>
                      </div>
                    </LazyLoad>

                    {/* Shape 02-1 (data-depth="2"): fadeIn */}
                    <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_accordion__shape_widget_2}>
                      <div className={styles.hn_accordion__widget_container}>
                        <div className={styles.hn_accordion__animation_widget}>
                          <span
                            data-depth="2"
                            className={styles.hn_accordion__animation_span}
                            style={{
                              transform: `translate3d(${mousePos.x * -2}px, ${mousePos.y * -2}px, 0px) rotate(0.0001deg)`,
                              transformStyle: 'preserve-3d',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <Image
                              src="https://demo.edublink.co/wp-content/uploads/2023/06/shape-02-1.png"
                              alt="shape-02"
                              width={168}
                              height={111}
                            />
                          </span>
                        </div>
                      </div>
                    </LazyLoad>

                    {/* Image 2: slide-left, delay 100 */}
                    <LazyLoad animation="slide-left" animationDelay={100} className={styles.hn_accordion__image_widget_2}>
                      <div className={styles.hn_accordion__widget_container}>
                        <Image
                          src="https://demo.edublink.co/wp-content/uploads/2023/06/faq-02.jpg"
                          alt="FAQ 02"
                          width={200}
                          height={240}
                          className={styles.hn_accordion__image_2}
                        />
                      </div>
                    </LazyLoad>

                  </div>
                </div>

              </div>
            </section>

            {/* Inner Section 2 */}
            <section className={styles.hn_accordion__inner_section_2}>
              <div className={styles.hn_accordion__inner_container_2}>

                <div className={styles.hn_accordion__inner_column_left_2}>
                  <div className={styles.hn_accordion__inner_widget_wrap_3}>

                    {/* Shape 02 (data-depth="2"): fadeIn */}
                    <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_accordion__shape_widget_3}>
                      <div className={styles.hn_accordion__widget_container}>
                        <div className={styles.hn_accordion__animation_widget}>
                          <span
                            data-depth="2"
                            className={styles.hn_accordion__animation_span}
                            style={{
                              transform: `translate3d(${mousePos.x * -2}px, ${mousePos.y * -2}px, 0px) rotate(0.0001deg)`,
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

                    {/* Shape 05 (data-depth="-2"): fadeIn */}
                    <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_accordion__shape_widget_4}>
                      <div className={styles.hn_accordion__widget_container}>
                        <div className={styles.hn_accordion__animation_widget}>
                          <span
                            data-depth="-2"
                            className={styles.hn_accordion__animation_span}
                            style={{
                              transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0px) rotate(0.0001deg)`,
                              transformStyle: 'preserve-3d',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <Image
                              src="https://demo.edublink.co/wp-content/uploads/2023/06/shape-05.png"
                              alt="shape-05"
                              width={210}
                              height={193}
                            />
                          </span>
                        </div>
                      </div>
                    </LazyLoad>

                    {/* Image 3: slide-right, delay 50 */}
                    <LazyLoad animation="slide-right" animationDelay={50} className={styles.hn_accordion__image_widget_3}>
                      <div className={styles.hn_accordion__widget_container}>
                        <Image
                          src="https://demo.edublink.co/wp-content/uploads/2023/06/faq-03.jpg"
                          alt="FAQ 03"
                          width={180}
                          height={270}
                          className={styles.hn_accordion__image_3}
                        />
                      </div>
                    </LazyLoad>

                  </div>
                </div>

                <div className={styles.hn_accordion__inner_column_right_2}>
                  <div className={styles.hn_accordion__inner_widget_wrap_4}>
                    {/* Image 4: slide-left, delay 100 */}
                    <LazyLoad animation="slide-left" animationDelay={100} className={styles.hn_accordion__image_widget_4}>
                      <div className={styles.hn_accordion__widget_container}>
                        <Image
                          src="https://demo.edublink.co/wp-content/uploads/2023/06/faq-04.jpg"
                          alt="FAQ 04"
                          width={240}
                          height={290}
                          className={styles.hn_accordion__image_4}
                        />
                      </div>
                    </LazyLoad>
                  </div>
                </div>

              </div>
            </section>

          </div>
        </div>

        {/* Right Column: Heading & Accordion Items */}
        <div className={styles.hn_accordion__column_right}>
          <div className={styles.hn_accordion__widget_wrap}>

            {/* Shape 02 Right (data-depth="1.5"): fadeIn */}
            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_accordion__shape_widget_5}>
              <div className={styles.hn_accordion__widget_container}>
                <div className={styles.hn_accordion__animation_widget}>
                  <span
                    data-depth="1.5"
                    className={styles.hn_accordion__animation_span}
                    style={{
                      transform: `translate3d(${mousePos.x * -1.5}px, ${mousePos.y * -1.5}px, 0px) rotate(0.0001deg)`,
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <Image
                      src="https://demo.edublink.co/wp-content/uploads/2023/06/shape-02.png"
                      alt="About-Shape-3"
                      width={280}
                      height={280}
                    />
                  </span>
                </div>
              </div>
            </LazyLoad>

            {/* Shape Color Dots (data-depth="-2.2"): fadeIn */}
            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_accordion__shape_widget_color}>
              <div className={styles.hn_accordion__widget_container}>
                <div className={styles.hn_accordion__animation_widget}>
                  <span
                    data-depth="-2.2"
                    className={styles.hn_accordion__animation_span}
                    style={{
                      transform: `translate3d(${mousePos.x * 2.2}px, ${mousePos.y * 2.2}px, 0px) rotate(0.0001deg)`,
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <span className={styles.hn_accordion__animation_color} />
                  </span>
                </div>
              </div>
            </LazyLoad>

            {/* Heading Widget: slide-up, delay 150 */}
            <LazyLoad animation="slide-up" animationDelay={150} className={styles.hn_accordion__heading_widget}>
              <div className={styles.hn_accordion__widget_container}>
                <div className={styles.hn_accordion__section_heading}>
                  <span className={styles.hn_accordion__pre_heading}>FAQ’S</span>
                  <h3 className={styles.hn_accordion__heading}>
                    Over 10 Years in <mark className={styles.hn_accordion__mark}>Distant Skill</mark> Development
                  </h3>
                  <div className={styles.hn_accordion__title_shape}>
                    <i className="icon-19"></i>
                  </div>
                </div>
              </div>
            </LazyLoad>

            {/* Accordion Widget: slide-up, delay 220 */}
            <LazyLoad animation="slide-up" animationDelay={220} className={styles.hn_accordion__accordion_widget}>
              <div className={styles.hn_accordion__widget_container}>
                <div className={styles.hn_accordion__eb_accordion}>

                  {faqItems.map((item, index) => {
                    const isOpen = openIndex === index;
                    return (
                      <div
                        key={item.id}
                        className={`${styles.hn_accordion__item} ${isOpen ? styles.item_active : ''
                          }`}
                      >
                        <h5
                          className={`${styles.hn_accordion__header} ${isOpen ? styles.header_active : ''
                            }`}
                          onClick={() => toggleAccordion(index)}
                        >
                          {item.question}
                        </h5>
                        <div
                          className={`${styles.hn_accordion__content} ${isOpen ? styles.content_open : ''
                            }`}
                        >
                          <div className={styles.hn_accordion__body}>
                            <p className={styles.hn_accordion__text}>{item.answer}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            </LazyLoad>

          </div>
        </div>

      </div>
    </section>
  );
}
