'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import ButtonGreen from '../common/ButtonGreen';
import CourseCard from '../common/CourseCard';
import LazyLoad from '../common/LazyLoad';
import styles from './FeaturedCourses.module.css';
import { fetchWPCourses, WPLPCourseItem } from '@/lib/api/courses';

interface FeaturedCourseUI {
    id: number;
    title: string;
    slug: string;
    link: string;
    imgSrc: string;
    duration: string;
    level: string;
    ratings: string;
    originPrice?: string;
    price: string;
    lessons: string;
    students: string;
    description: string;
}

function helperStripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

function decodeHTMLEntities(str?: string): string {
    if (!str) return '';
    return str
        .replace(/&#038;/g, '&')
        .replace(/&amp;/g, '&')
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

export default function FeaturedCourses() {
    const [courses, setCourses] = useState<FeaturedCourseUI[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        async function loadTop3Courses() {
            setLoading(true);
            const wpRes = await fetchWPCourses({ perPage: 3, sort: 'newest' });
            if (isMounted && wpRes && wpRes.courses && wpRes.courses.length > 0) {
                const mapped: FeaturedCourseUI[] = wpRes.courses.map((item: WPLPCourseItem) => {
                    const itemTitle = decodeHTMLEntities(item.title?.rendered);
                    const featuredImg = item._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://demo.edublink.co/wp-content/uploads/2023/03/course-04-590x430.jpg';
                    const cleanExcerpt = helperStripHtml(item.excerpt?.rendered) || 'Lorem ipsum dolor sit amet consectur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut...';

                    const durationMeta = (item as any)._lp_duration || item.meta?._lp_duration || '15 weeks';
                    const levelMeta = (item as any)._lp_level || item.meta?._lp_level || 'Beginner';
                    const salePriceMeta = (item as any)._lp_sale_price || item.meta?._lp_sale_price;
                    const regPriceMeta = (item as any)._lp_regular_price || (item as any)._lp_price || item.meta?._lp_regular_price || item.meta?._lp_price;
                    const studentsMeta = (item as any)._lp_students || item.meta?._lp_students || '0';
                    const lessonsMeta = (item as any)._lp_lessons || item.meta?._lp_lessons || ((item as any).sections ? (item as any).sections.reduce((acc: number, s: any) => acc + (s.items?.filter((it: any) => it.item_type !== 'lp_quiz').length || 0), 0) : '7');

                    let priceDisplay = 'Free';
                    let originPriceDisplay: string | undefined = undefined;

                    if (salePriceMeta && Number(salePriceMeta) > 0) {
                        priceDisplay = `$${salePriceMeta}`;
                        if (regPriceMeta) {
                            originPriceDisplay = `$${regPriceMeta}`;
                        }
                    } else if (regPriceMeta !== undefined && regPriceMeta !== '') {
                        priceDisplay = parseFloat(String(regPriceMeta)) === 0 ? 'Free' : `$${regPriceMeta}`;
                    }

                    return {
                        id: item.id,
                        title: itemTitle,
                        slug: item.slug,
                        link: `/courses/${item.slug}`,
                        imgSrc: featuredImg,
                        duration: durationMeta,
                        level: levelMeta,
                        ratings: '(5.0/ 3 Ratings)',
                        originPrice: originPriceDisplay,
                        price: priceDisplay,
                        lessons: `${lessonsMeta} Lessons`,
                        students: `${studentsMeta} Students`,
                        description: cleanExcerpt,
                    };
                });
                setCourses(mapped);
            }
            if (isMounted) {
                setLoading(false);
            }
        }
        loadTop3Courses();
        return () => {
            isMounted = false;
        };
    }, []);
    return (
        <section className={styles.hn_featured_courses}>
            <Image src="/images/banner_background_bottom.svg" alt="Hero Background" width={1920} height={1080} className={styles.hn_featured_courses__overlay} />
            <div className={styles.hn_featured_courses__container}>
                <div className={styles.hn_featured_courses__column}>
                    <div className={styles.hn_featured_courses__widget_wrap}>

                        {/* Heading Widget: edublink--slide-up, delay 100 */}
                        <LazyLoad animation="slide-up" animationDelay={100}>
                            <div className={styles.hn_featured_courses__heading_widget}>
                                <div className={styles.hn_featured_courses__heading_container}>
                                    <div className={styles.hn_featured_courses__section_heading}>
                                        <span className={styles.hn_featured_courses__pre_heading}>POPULAR COURSES</span>
                                        <h3 className={styles.hn_featured_courses__heading}>Pick A Course To Get Started</h3>
                                        <div className={styles.hn_featured_courses__title_shape}>
                                            <i className="icon-19"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </LazyLoad>

                        {/* Courses Grid Widget: edublink--slide-up, delay 150 */}
                        <LazyLoad animation="slide-up" animationDelay={150}>
                            <div className={styles.hn_featured_courses__courses_widget}>
                                <div className={styles.hn_featured_courses__courses_container}>
                                    <div className={styles.hn_featured_courses__courses_wrapper}>
                                        <div className={styles.hn_featured_courses__grid}>
                                            {courses.map((course) => (
                                                <div key={course.id} className={styles.hn_featured_courses__item}>
                                                    <CourseCard
                                                        id={course.id}
                                                        title={course.title}
                                                        link={course.link}
                                                        imgSrc={course.imgSrc}
                                                        duration={course.duration}
                                                        level={course.level}
                                                        ratings={course.ratings}
                                                        price={course.price}
                                                        originPrice={course.originPrice || undefined}
                                                        lessons={course.lessons}
                                                        students={course.students}
                                                        description={course.description}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </LazyLoad>

                        {/* Button Widget: edublink--slide-up, delay 150 */}
                        <LazyLoad animation="slide-up" animationDelay={150}>
                            <div className={styles.hn_featured_courses__button_widget}>
                                <div className={styles.hn_featured_courses__button_container}>
                                    <div className={styles.hn_featured_courses__button_wrapper}>
                                        <div className={styles.hn_featured_courses__button}>
                                            <ButtonGreen
                                                href="/courses"
                                                text="Browse More Courses"
                                                className={styles.hn_featured_courses__browse_button}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </LazyLoad>

                    </div>
                </div>
            </div>
        </section>
    );
}
