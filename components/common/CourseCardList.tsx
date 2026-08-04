'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './CourseCardList.module.css';
import WishlistButton from './WishlistButton';
import { CourseCardProps } from './CourseCard';

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

export default function CourseCardList({
    id,
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
    // Helper lấy đường dẫn khóa học dạng Next.js Route
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
            const clean = rawLink.replace(/^\/+|\/+$/g, '');
            return `/courses/${clean}`;
        }
        return '#';
    };

    const courseLink = getCourseLink(link, slug);

    // Title
    const displayTitle = decodeHTMLEntities(title);

    // Duration
    const displayDuration = _lp_duration || duration || '15 weeks';

    // Level / Category
    const displayLevel = _lp_level || level || 'Business';

    // Rating
    let displayRatings = ratings || '(5.0)';
    if (rating_details) {
        const avg = rating_details.average !== undefined ? rating_details.average : 5;
        displayRatings = `(${avg.toFixed(1)})`;
    } else if (_lp_rating !== undefined) {
        displayRatings = `(${Number(_lp_rating).toFixed(1)})`;
    }

    // Price
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

    // Students
    const displayStudents = _lp_students !== undefined
        ? typeof _lp_students === 'number' ? `${_lp_students} Students` : _lp_students
        : typeof students === 'number' ? `${students} Students` : students || '150 Students';

    // Lessons
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

    // Description
    const rawDesc = post_excerpt || description || 'Lorem ipsum dolor sit amet consectur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...';
    const displayDescription = decodeHTMLEntities(rawDesc);

    return (
        <div className={`${styles.hn_course_card_list__item} ${className}`}>
            <div className={styles.hn_course_card_list__single_course}>
                <div className={styles.hn_course_card_list__inner}>
                    {/* Course Thumbnail */}
                    <div className={styles.hn_course_card_list__thumbnail}>
                        <Link className={styles.hn_course_card_list__thumb_link} href={courseLink}>
                            <Image
                                className={styles.hn_course_card_list__thumb_img}
                                src={imgSrc}
                                alt={displayTitle}
                                width={590}
                                height={430}
                                unoptimized
                            />
                        </Link>
                        <div className={styles.hn_course_card_list__time_top}>
                            <span className={styles.hn_course_card_list__duration}>
                                <i className="icon-61"></i>
                                {displayDuration}
                            </span>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className={styles.hn_course_card_list__main_content}>
                        <div className={styles.hn_course_card_list__price_box}>
                            <span className={styles.hn_course_card_list__item_price}>
                                {formattedOriginPrice && (
                                    <span className={styles.hn_course_card_list__origin_price}>{formattedOriginPrice}</span>
                                )}
                                {formattedOriginPrice ? (
                                    <span className={styles.hn_course_card_list__price}>{formattedPrice}</span>
                                ) : (
                                    <span className={styles.hn_course_card_list__free_price}>{formattedPrice}</span>
                                )}
                            </span>
                        </div>

                        <h6 className={styles.hn_course_card_list__title}>
                            <Link href={courseLink}>{displayTitle}</Link>
                        </h6>

                        {/* Rating */}
                        <div className={styles.hn_course_card_list__rating}>
                            <div className={styles.hn_course_card_list__review_wrapper}>
                                <div className={styles.hn_course_card_list__review_stars}>
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className={styles.hn_course_card_list__review_star}>
                                            <span className={styles.hn_course_card_list__star_far}>
                                                <svg width="17px" height="16px" viewBox="0 0 17 16" xmlns="http://www.w3.org/2000/svg">
                                                    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                                        <g fill="#FFB606" fillRule="nonzero">
                                                            <path d="M8.5,0 L10.9285714,6.15384615 L17,6.15384615 L11.5357143,9.84615385 L13.9642857,16 L8.5,12.3076923 L3.03571429,16 L5.46428571,9.84615385 L0,6.15384615 L6.07142857,6.15384615 L8.5,0 Z M8.46921775,3.53848077 L7.09419569,7.21637091 L3.96923077,7.21637091 L6.96923077,9.20675852 L5.63589261,12.5384808 L8.46921775,10.5710529 L11.3025689,12.5384808 L9.96921341,9.20675852 L12.9692308,7.21637091 L9.84423981,7.21637091 L8.46921775,3.53848077 Z" />
                                                        </g>
                                                    </g>
                                                </svg>
                                            </span>
                                            <span className={styles.hn_course_card_list__star_fas} style={{ width: '100%' }}>
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
                                <span className={styles.hn_course_card_list__rating_text}>{displayRatings}</span>
                            </div>
                        </div>

                        <p className={styles.hn_course_card_list__desc}>{displayDescription}</p>

                        <ul className={styles.hn_course_card_list__meta}>
                            <li><i className="icon-24"></i>{displayLessons}</li>
                            <li><i className="icon-25"></i>{displayStudents}</li>
                        </ul>
                    </div>

                    {/* Hover Content (Giao diện khi hover hiển thị chi tiết) */}
                    <div className={styles.hn_course_card_list__hover_content}>
                        <div className={styles.hn_course_card_list__hover_inner}>
                            <div className={styles.hn_course_card_list__hover_main}>
                                <span className={styles.hn_course_card_list__level}>
                                    <Link href={courseLink}>{displayLevel}</Link>
                                </span>
                                <h6 className={styles.hn_course_card_list__title}>
                                    <Link href={courseLink}>{displayTitle}</Link>
                                </h6>

                                {/* Hover Rating */}
                                <div className={styles.hn_course_card_list__rating}>
                                    <div className={styles.hn_course_card_list__review_wrapper}>
                                        <div className={styles.hn_course_card_list__review_stars}>
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className={styles.hn_course_card_list__review_star}>
                                                    <span className={styles.hn_course_card_list__star_far}>
                                                        <svg width="17px" height="16px" viewBox="0 0 17 16" xmlns="http://www.w3.org/2000/svg">
                                                            <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                                                <g fill="#FFB606" fillRule="nonzero">
                                                                    <path d="M8.5,0 L10.9285714,6.15384615 L17,6.15384615 L11.5357143,9.84615385 L13.9642857,16 L8.5,12.3076923 L3.03571429,16 L5.46428571,9.84615385 L0,6.15384615 L6.07142857,6.15384615 L8.5,0 Z M8.46921775,3.53848077 L7.09419569,7.21637091 L3.96923077,7.21637091 L6.96923077,9.20675852 L5.63589261,12.5384808 L8.46921775,10.5710529 L11.3025689,12.5384808 L9.96921341,9.20675852 L12.9692308,7.21637091 L9.84423981,7.21637091 L8.46921775,3.53848077 Z" />
                                                                </g>
                                                            </g>
                                                        </svg>
                                                    </span>
                                                    <span className={styles.hn_course_card_list__star_fas} style={{ width: '100%' }}>
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
                                        <span className={styles.hn_course_card_list__rating_text}>{displayRatings}</span>
                                    </div>
                                </div>

                                <ul className={styles.hn_course_card_list__hover_meta}>
                                    <li>{displayLessons}</li>
                                    <li>{displayDuration}</li>
                                    <li>{displayLevel}</li>
                                </ul>

                                <div className={styles.hn_course_card_list__feature}>
                                    <h6 className={styles.hn_course_card_list__feature_title}>What You’ll Learn?</h6>
                                    <ul>
                                        <li>Python Programming: A Beginner's Guide</li>
                                        <li>Mastering Python: From Novice to Expert</li>
                                        <li>Building Web Applications with Python</li>
                                    </ul>
                                </div>

                                <div className={styles.hn_course_card_list__button_group}>
                                    <Link className={styles.hn_course_card_list__enroll_btn} href={courseLink}>
                                        Enroll Now
                                    </Link>
                                    {id && (
                                        <WishlistButton
                                            courseId={Number(id)}
                                            className={styles.hn_course_card_list__wishlist_btn}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}