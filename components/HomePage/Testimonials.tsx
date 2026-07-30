'use client';

import Image from 'next/image';
import ButtonGreen from '../common/ButtonGreen';
import LazyLoad from '../common/LazyLoad';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

import styles from './Testimonials.module.css';

const testimonialsData = [
    {
        id: 1,
        name: 'David Owens',
        role: 'Designer',
        avatar: 'https://demo.edublink.co/wp-content/uploads/2023/06/testimonial-01.png',
        desc: 'Lorem ipsum dolor amet consec tur elit adicing sed do usmod zx tempor enim minim veniam quis nostrud exer citation.',
    },
    {
        id: 2,
        name: 'Bob Limones',
        role: 'Student',
        avatar: 'https://demo.edublink.co/wp-content/uploads/2023/06/testimonial-02.png',
        desc: 'Lorem ipsum dolor amet consec tur elit adicing sed do usmod zx tempor enim minim veniam quis nostrud exer citation.',
    },
    {
        id: 3,
        name: 'Tom Hurley',
        role: 'Content Creator',
        avatar: 'https://demo.edublink.co/wp-content/uploads/2023/06/testimonial-04.jpg',
        desc: 'Lorem ipsum dolor amet consec tur elit adicing sed do usmod zx tempor enim minim veniam quis nostrud exer citation.',
    },
    {
        id: 4,
        name: 'Robert Lane',
        role: 'Developer',
        avatar: 'https://demo.edublink.co/wp-content/uploads/2023/06/testimonial-03.png',
        desc: 'Lorem ipsum dolor amet consec tur elit adicing sed do usmod zx tempor enim minim veniam quis nostrud exer citation.',
    },
    {
        id: 5,
        name: 'David Owens',
        role: 'Designer',
        avatar: 'https://demo.edublink.co/wp-content/uploads/2023/06/testimonial-01.png',
        desc: 'Lorem ipsum dolor amet consec tur elit adicing sed do usmod zx tempor enim minim veniam quis nostrud exer citation.',
    },
    {
        id: 6,
        name: 'Bob Limones',
        role: 'Student',
        avatar: 'https://demo.edublink.co/wp-content/uploads/2023/06/testimonial-02.png',
        desc: 'Lorem ipsum dolor amet consec tur elit adicing sed do usmod zx tempor enim minim veniam quis nostrud exer citation.',
    },
];

interface TestimonialsProps {
    className?: string;
}

export default function Testimonials({ className = '' }: TestimonialsProps) {
    return (
        <section className={`${styles.hn_testimonials} ${className}`}>
            <div className={styles.hn_testimonials__container}>
                {/* Left Column: Heading & Button */}
                <div className={styles.hn_testimonials__column_left}>
                    <div className={styles.hn_testimonials__widget_wrap}>

                        {/* Section Heading Widget: edublink--slide-up, delay 100 */}
                        <LazyLoad animation="slide-up" animationDelay={100}>
                            <div className={styles.hn_testimonials__heading_widget}>
                                <div className={styles.hn_testimonials__widget_container}>
                                    <div className={styles.hn_testimonials__section_heading}>
                                        <span className={styles.hn_testimonials__pre_heading}>TESTIMONIALS</span>
                                        <h3 className={styles.hn_testimonials__heading}>
                                            What Our Students Have To Say
                                        </h3>
                                        <div className={styles.hn_testimonials__title_shape}>
                                            <i className="icon-19"></i>
                                        </div>
                                        <div className={styles.hn_testimonials__sub_heading}>
                                            Lorem ipsum dolor sit amet consectur adipiscing elit sed eiusmod tempor
                                            incididunt labore dolore magna aliquaenim ad minim.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </LazyLoad>

                        {/* Button Widget: edublink--slide-up, delay 160 */}
                        <LazyLoad animation="slide-up" animationDelay={160}>
                            <div className={styles.hn_testimonials__button_widget}>
                                <div className={styles.hn_testimonials__widget_container}>
                                    <div className={styles.hn_testimonials__button_wrapper}>
                                        <ButtonGreen text="View All" className={styles.hn_testimonials__button_item} />
                                    </div>
                                </div>
                            </div>
                        </LazyLoad>

                    </div>
                </div>

                {/* Right Column: Testimonial Swiper Carousel */}
                <div className={styles.hn_testimonials__column_right}>
                    <div className={styles.hn_testimonials__widget_wrap}>
                        <div className={styles.hn_testimonials__testimonial_widget}>
                            <div className={styles.hn_testimonials__widget_container}>
                                <div className={styles.hn_testimonials__wrapper}>

                                    <Swiper
                                        effect={'coverflow'}
                                        speed={500}
                                        grabCursor={true}
                                        centeredSlides={true}
                                        slidesPerView={2}
                                        initialSlide={0}
                                        loop={true}
                                        coverflowEffect={{
                                            rotate: 0,
                                            stretch: 80,
                                            depth: 180,
                                            scale: 1,
                                            modifier: 1,
                                            slideShadows: false,
                                        }}
                                        breakpoints={{
                                            575: {
                                                slidesPerView: 2,
                                            },
                                        }}
                                        pagination={{ clickable: true }}
                                        modules={[EffectCoverflow, Pagination]}
                                        className={styles.hn_testimonials__swiper_wrapper}
                                    >
                                        {testimonialsData.map((item) => (
                                            <SwiperSlide
                                                key={item.id}
                                                className={styles.hn_testimonials__swiper_slide}
                                                style={{ width: '345px' }}
                                            >
                                                <div className={styles.hn_testimonials__item}>
                                                    <div className={styles.hn_testimonials__grid}>

                                                        {/* Thumbnail */}
                                                        <div className={styles.hn_testimonials__thumbnail}>
                                                            <Image
                                                                src={item.avatar}
                                                                alt={item.name}
                                                                width={70}
                                                                height={70}
                                                                className={styles.hn_testimonials__author_avatar}
                                                            />
                                                            <span className={styles.hn_testimonials__quote_icon}>
                                                                <i className="icon-26"></i>
                                                            </span>
                                                        </div>

                                                        {/* Content */}
                                                        <div className={styles.hn_testimonials__content}>
                                                            <p className={styles.hn_testimonials__description}>
                                                                {item.desc}
                                                            </p>

                                                            {/* Rating Stars */}
                                                            <div className={styles.hn_testimonials__rating_icon}>
                                                                <i className="icon-23"></i>
                                                                <i className="icon-23"></i>
                                                                <i className="icon-23"></i>
                                                                <i className="icon-23"></i>
                                                                <i className="icon-23"></i>
                                                            </div>

                                                            <h5 className={styles.hn_testimonials__title}>{item.name}</h5>
                                                            <span className={styles.hn_testimonials__subtitle}>
                                                                {item.role}
                                                            </span>
                                                        </div>

                                                    </div>
                                                </div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
