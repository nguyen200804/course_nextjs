'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './CourseCard.module.css';

export interface CourseCardProps {
    id?: number | string;
    title: string;
    imgSrc: string;
    link?: string;
    slug?: string;

    // LearnPress Meta: _lp_duration
    _lp_duration?: string;
    duration?: string;

    // LearnPress Meta: _lp_level
    _lp_level?: string;
    level?: string;

    // LearnPress Meta: _lp_rating
    _lp_rating?: string | number;
    rating_details?: any;
    ratings?: string;

    // LearnPress Meta: _lp_price, _lp_regular_price, _lp_sale_price
    _lp_price?: string | number;
    _lp_regular_price?: string | number;
    _lp_sale_price?: string | number;
    price?: string | number;
    originPrice?: string | number;

    // LearnPress Meta: _lp_students
    _lp_students?: string | number;
    students?: string | number;

    // LearnPress Meta: _lp_lessons
    _lp_lessons?: string | number;
    lessons?: string | number;
    sections?: any[];

    // LearnPress Post Excerpt: post_excerpt / excerpt
    post_excerpt?: string;
    description?: string;

    className?: string;
}

const decodeHTMLEntities = (text?: string) => {
    if (!text) return '';
    return text
        .replace(/&#038;/g, '&')
        .replace(/&amp;/g, '&')
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#8211;/g, '–')
        .replace(/&#8212;/g, '—')
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
};

export default function CourseCard({
    title,
    imgSrc,
    link = '#',
    slug,
    _lp_duration,
    duration,
    _lp_level,
    level,
    _lp_rating,
    rating_details,
    ratings,
    _lp_price,
    _lp_regular_price,
    _lp_sale_price,
    price,
    originPrice,
    _lp_students,
    students,
    _lp_lessons,
    lessons = '10 Lessons',
    sections,
    post_excerpt,
    description,
    className = '',
}: CourseCardProps) {
    // Helper to get local Next.js route instead of WordPress full URL
    const getCourseLink = (rawLink?: string, rawSlug?: string) => {
        if (rawSlug) return `/courses/${rawSlug}`;
        if (!rawLink || rawLink === '#') return '#';
        if (rawLink.startsWith('/courses/')) return rawLink;
        try {
            const url = new URL(rawLink);
            const pathSegments = url.pathname.split('/').filter(Boolean);
            if (pathSegments.length > 0) {
                const lastSegment = pathSegments[pathSegments.length - 1];
                return `/courses/${lastSegment}`;
            }
        } catch {
            // fallback if rawLink is relative path or slug
            const clean = rawLink.replace(/^\/+|\/+$/g, '');
            return `/courses/${clean}`;
        }
        return '#';
    };

    const courseLink = getCourseLink(link, slug);

    // Determine Title
    const displayTitle = decodeHTMLEntities(title);

    // Determine Duration from _lp_duration or duration
    const displayDuration = _lp_duration || duration || '15 weeks';

    // Determine Level from _lp_level or level
    const displayLevel = _lp_level || level || 'Beginner';

    // Determine Rating from rating_details, _lp_rating or ratings
    let displayRatings = ratings || '(5.0/ 0 Ratings)';
    if (rating_details) {
        const avg = rating_details.average !== undefined ? rating_details.average : 5;
        const total = rating_details.total !== undefined ? rating_details.total : 0;
        displayRatings = `(${avg}/ ${total} Ratings)`;
    } else if (_lp_rating !== undefined) {
        displayRatings = `(${_lp_rating}/ 5 Ratings)`;
    }

    // Determine Price
    let finalPrice: string | number | undefined = price || '$30';
    let finalOriginPrice: string | number | undefined = originPrice;

    if (_lp_sale_price && Number(_lp_sale_price) > 0) {
        finalPrice = typeof _lp_sale_price === 'number' ? `$${_lp_sale_price}` : _lp_sale_price;
        if (_lp_regular_price || _lp_price) {
            const rawReg = _lp_regular_price || _lp_price;
            finalOriginPrice = typeof rawReg === 'number' ? `$${rawReg}` : rawReg;
        }
    } else if (_lp_regular_price || _lp_price) {
        const rawReg = _lp_regular_price || _lp_price;
        finalPrice = typeof rawReg === 'number' ? `$${rawReg}` : rawReg;
    }

    const formattedPrice = typeof finalPrice === 'number' ? `$${finalPrice}` : finalPrice;
    const formattedOriginPrice = typeof finalOriginPrice === 'number' ? `$${finalOriginPrice}` : finalOriginPrice;

    // Determine Students from _lp_students or students
    const displayStudents = _lp_students !== undefined
        ? typeof _lp_students === 'number' ? `${_lp_students} Students` : _lp_students
        : typeof students === 'number' ? `${students} Students` : students || '150 Students';

    // Determine Lessons (excluding lp_quiz)
    let displayLessons = typeof lessons === 'number' ? `${lessons} Lessons` : lessons;

    if (sections && Array.isArray(sections)) {
        const lessonItemsOnlyCount = sections.reduce((acc: number, sec: any) => {
            const items = sec.items ? sec.items.filter((it: any) => it.item_type !== 'lp_quiz') : [];
            return acc + items.length;
        }, 0);
        if (lessonItemsOnlyCount > 0) {
            displayLessons = `${lessonItemsOnlyCount} Lessons`;
        }
    } else if (_lp_lessons !== undefined && _lp_lessons !== '') {
        displayLessons = typeof _lp_lessons === 'number' ? `${_lp_lessons} Lessons` : (String(_lp_lessons).includes('Lesson') ? String(_lp_lessons) : `${_lp_lessons} Lessons`);
    }

    // Determine Description from post_excerpt or description
    const rawDesc = post_excerpt || description || 'Lorem ipsum dolor sit amet consectur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut...';
    const displayDescription = decodeHTMLEntities(rawDesc);

    return (
        <div className={`${styles.hn_featured_courses__single_course} ${className}`}>
            <div className={styles.hn_featured_courses__inner}>
                {/* Course Thumbnail */}
                <div className={styles.hn_featured_courses__thumbnail}>
                    <Link className={styles.hn_featured_courses__thumb_link} href={courseLink}>
                        <Image
                            className={styles.hn_featured_courses__thumb_img}
                            src={imgSrc}
                            alt={displayTitle}
                            width={590}
                            height={430}
                            unoptimized
                        />
                    </Link>
                    <div className={styles.hn_featured_courses__time_top}>
                        <span className={styles.hn_featured_courses__duration}>
                            <i className="icon-61"></i>
                            {displayDuration}
                        </span>
                    </div>
                </div>

                {/* Course Content */}
                <div className={styles.hn_featured_courses__content}>
                    <span className={styles.hn_featured_courses__level}>{displayLevel}</span>
                    <h6 className={styles.hn_featured_courses__title}>
                        <Link className={styles.hn_featured_courses__title_link} href={courseLink}>
                            {displayTitle}
                        </Link>
                    </h6>

                    {/* Rating */}
                    <div className={styles.hn_featured_courses__rating}>
                        <div className={styles.hn_featured_courses__review_wrapper}>
                            <div className={styles.hn_featured_courses__review_stars}>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={styles.hn_featured_courses__review_star}>
                                        <span className={styles.hn_featured_courses__star_far}>
                                            <svg width="17px" height="16px" viewBox="0 0 17 16" xmlns="http://www.w3.org/2000/svg">
                                                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                                    <g fill="#FFB606" fillRule="nonzero">
                                                        <path d="M8.5,0 L10.9285714,6.15384615 L17,6.15384615 L11.5357143,9.84615385 L13.9642857,16 L8.5,12.3076923 L3.03571429,16 L5.46428571,9.84615385 L0,6.15384615 L6.07142857,6.15384615 L8.5,0 Z M8.46921775,3.53848077 L7.09419569,7.21637091 L3.96923077,7.21637091 L6.96923077,9.20675852 L5.63589261,12.5384808 L8.46921775,10.5710529 L11.3025689,12.5384808 L9.96921341,9.20675852 L12.9692308,7.21637091 L9.84423981,7.21637091 L8.46921775,3.53848077 Z" />
                                                    </g>
                                                </g>
                                            </svg>
                                        </span>
                                        <span className={styles.hn_featured_courses__star_fas} style={{ width: '100%' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="17px" height="16px" viewBox="0 0 17 16">
                                                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                                    <g fill="#FFB606" fillRule="nonzero">
                                                        <polygon points="8.5 12.3076923 3.03571429 16 5.46428571 9.84615385 0 6.15384615 6.07142857 6.15384615 8.5 0 10.9285714 6.15384615 17 6.15384615 11.5357143 9.84615385 13.9642857 16" />
                                                    </g>
                                                </g>
                                            </svg>
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <span className={styles.hn_featured_courses__rating_text}>{displayRatings}</span>
                        </div>
                    </div>

                    {/* Price */}
                    <div className={styles.hn_featured_courses__price_box}>
                        <span className={styles.hn_featured_courses__item_price}>
                            {formattedOriginPrice && (
                                <span className={styles.hn_featured_courses__origin_price}>{formattedOriginPrice}</span>
                            )}
                            {formattedOriginPrice ? (
                                <span className={styles.hn_featured_courses__price}>{formattedPrice}</span>
                            ) : (
                                <span className={styles.hn_featured_courses__free_price}>{formattedPrice}</span>
                            )}
                        </span>
                    </div>

                    {/* Meta Info */}
                    <ul className={styles.hn_featured_courses__meta}>
                        <li className={styles.hn_featured_courses__meta_item}>
                            <i className="icon-24"></i>
                            {displayLessons}
                        </li>
                        <li className={styles.hn_featured_courses__meta_item}>
                            <i className="icon-25"></i>
                            {displayStudents}
                        </li>
                    </ul>
                </div>
            </div>

            {/* Hover Content */}
            <div className={styles.hn_featured_courses__hover_wrapper}>
                <div className={styles.hn_featured_courses__wishlist_top}>
                    <button
                        type="button"
                        className={styles.hn_featured_courses__wishlist_btn}
                        title="Add this course to your wishlist"
                    >
                        <i className="icon-22"></i>
                    </button>
                </div>
            </div>

            <div className={styles.hn_featured_courses__hover_content}>
                <div className={styles.hn_featured_courses__hover_inner}>
                    <span className={styles.hn_featured_courses__level}>{displayLevel}</span>
                    <h6 className={styles.hn_featured_courses__title}>
                        <Link className={styles.hn_featured_courses__title_link} href={courseLink}>
                            {displayTitle}
                        </Link>
                    </h6>

                    {/* Rating in Hover */}
                    <div className={styles.hn_featured_courses__rating}>
                        <div className={styles.hn_featured_courses__review_wrapper}>
                            <div className={styles.hn_featured_courses__review_stars}>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={styles.hn_featured_courses__review_star}>
                                        <span className={styles.hn_featured_courses__star_far}>
                                            <svg width="17px" height="16px" viewBox="0 0 17 16" xmlns="http://www.w3.org/2000/svg">
                                                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                                    <g fill="#FFB606" fillRule="nonzero">
                                                        <path d="M8.5,0 L10.9285714,6.15384615 L17,6.15384615 L11.5357143,9.84615385 L13.9642857,16 L8.5,12.3076923 L3.03571429,16 L5.46428571,9.84615385 L0,6.15384615 L6.07142857,6.15384615 L8.5,0 Z M8.46921775,3.53848077 L7.09419569,7.21637091 L3.96923077,7.21637091 L6.96923077,9.20675852 L5.63589261,12.5384808 L8.46921775,10.5710529 L11.3025689,12.5384808 L9.96921341,9.20675852 L12.9692308,7.21637091 L9.84423981,7.21637091 L8.46921775,3.53848077 Z" />
                                                    </g>
                                                </g>
                                            </svg>
                                        </span>
                                        <span className={styles.hn_featured_courses__star_fas} style={{ width: '100%' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="17px" height="16px" viewBox="0 0 17 16">
                                                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                                    <g fill="#FFB606" fillRule="nonzero">
                                                        <polygon points="8.5 12.3076923 3.03571429 16 5.46428571 9.84615385 0 6.15384615 6.07142857 6.15384615 8.5 0 10.9285714 6.15384615 17 6.15384615 11.5357143 9.84615385 13.9642857 16" />
                                                    </g>
                                                </g>
                                            </svg>
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <span className={styles.hn_featured_courses__rating_text}>{displayRatings}</span>
                        </div>
                    </div>

                    {/* Price in Hover */}
                    <div className={styles.hn_featured_courses__price_box}>
                        <span className={styles.hn_featured_courses__item_price}>
                            {formattedOriginPrice && (
                                <span className={styles.hn_featured_courses__origin_price}>{formattedOriginPrice}</span>
                            )}
                            {formattedOriginPrice ? (
                                <span className={styles.hn_featured_courses__price}>{formattedPrice}</span>
                            ) : (
                                <span className={styles.hn_featured_courses__free_price}>{formattedPrice}</span>
                            )}
                        </span>
                    </div>

                    <p className={styles.hn_featured_courses__hover_desc}>{displayDescription}</p>

                    {/* Meta Info in Hover */}
                    <ul className={styles.hn_featured_courses__meta}>
                        <li className={styles.hn_featured_courses__meta_item}>
                            <i className="icon-24"></i>
                            {displayLessons}
                        </li>
                        <li className={styles.hn_featured_courses__meta_item}>
                            <i className="icon-25"></i>
                            {displayStudents}
                        </li>
                    </ul>

                    <Link className={styles.hn_featured_courses__enroll_btn} href={courseLink}>
                        <span>Enroll Now</span>
                        <i className="icon-4"></i>
                    </Link>
                </div>
            </div>
        </div>
    );
}
