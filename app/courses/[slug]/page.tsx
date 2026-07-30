'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ButtonGreen from '@/components/common/ButtonGreen';
import CourseCard from '@/components/common/CourseCard';
import { fetchWPCourseBySlug, fetchWPCourses, WPLPCourseItem } from '@/lib/api/courses';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import Loading from './loading';
import styles from './CourseDetailsPage.module.css';

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

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';

  const [course, setCourse] = useState<WPLPCourseItem | null>(null);
  const [relatedCourses, setRelatedCourses] = useState<WPLPCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    async function loadCourse() {
      setIsLoading(true);
      const data = await fetchWPCourseBySlug(slug);
      setCourse(data);
      if (data && (data as any).sections && Array.isArray((data as any).sections)) {
        const allSecKeys = (data as any).sections.map((sec: any, idx: number) => `section-${sec.section_id || idx}`);
        setOpenSections(allSecKeys);
      }

      // Check enrollment status
      if (data?.id) {
        try {
          const enrollRes = await fetch(`/api/user/enrollment?course_id=${data.id}`);
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            setIsEnrolled(enrollData.isEnrolled || false);
          }
        } catch {
          setIsEnrolled(false);
        }
      }

      const relRes = await fetchWPCourses({ perPage: 4, sort: 'newest' });
      if (relRes && relRes.courses) {
        setRelatedCourses(relRes.courses.filter((c) => c.slug !== slug).slice(0, 3));
      }

      setIsLoading(false);
    }
    loadCourse();
  }, [slug]);


  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / 50;
      const y = (e.clientY - window.innerHeight / 2) / 50;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  // Extract dynamic WP REST API post_type=lp_course fields
  const title = decodeHTMLEntities(course?.title?.rendered) || 'Competitive Strategy Law for Management Consultants';
  const authorObj = course?._embedded?.['author']?.[0];
  const instructorName = decodeHTMLEntities(authorObj?.name) || 'Hilary Swank';
  const categoryTerm = course?._embedded?.['wp:term']?.[0]?.[0];
  const categoryName = decodeHTMLEntities(categoryTerm?.name) || 'Business';
  const categoryLink = categoryTerm ? `/courses?category=${categoryTerm.id}` : '/courses';



  // Helper to extract LearnPress Meta Keys from root object or course.meta
  const getMeta = (key: string) => {
    if (!course) return undefined;
    const val = (course as any)[key] ?? course.meta?.[key];
    return val !== undefined && val !== null && val !== '' ? val : undefined;
  };

  const lpPrice = getMeta('_lp_price');
  const lpSalePrice = getMeta('_lp_sale_price');
  const lpRegPrice = getMeta('_lp_regular_price');

  let priceDisplay = '$75';
  let originPriceDisplay: string | null = null;

  if (lpSalePrice && Number(lpSalePrice) > 0) {
    priceDisplay = `$${lpSalePrice}`;
    if (lpRegPrice || lpPrice) {
      originPriceDisplay = `$${lpRegPrice || lpPrice}`;
    }
  } else if (lpPrice !== undefined) {
    priceDisplay = parseFloat(String(lpPrice)) === 0 ? 'Free' : `$${lpPrice}`;
  } else if (lpRegPrice !== undefined) {
    priceDisplay = parseFloat(String(lpRegPrice)) === 0 ? 'Free' : `$${lpRegPrice}`;
  }

  // meta_key: _lp_duration
  const durationDisplay = getMeta('_lp_duration') || '25 hours';

  // Calculate dynamic lessons count from curriculum sections (excluding lp_quiz)
  const calculatedLessonsCount = (course as any)?.sections && Array.isArray((course as any).sections)
    ? (course as any).sections.reduce((acc: number, sec: any) => {
      const lessonItemsOnly = sec.items ? sec.items.filter((it: any) => it.item_type !== 'lp_quiz') : [];
      return acc + lessonItemsOnly.length;
    }, 0)
    : undefined;

  const lessonsDisplay = (calculatedLessonsCount !== undefined && calculatedLessonsCount > 0)
    ? calculatedLessonsCount
    : (getMeta('_lp_lessons') || getMeta('_lp_lesson_count') || '7');

  // meta_key: _lp_students / _lp_max_students
  const studentsDisplay = getMeta('_lp_students') || getMeta('_lp_max_students') || '362';

  // meta_key: _lp_language
  const languageDisplay = getMeta('_lp_language') || 'English';

  // meta_key: _lp_certificate
  const certificateMeta = getMeta('_lp_certificate') || getMeta('_lp_has_certificate');
  const certificateDisplay = certificateMeta ? (String(certificateMeta).toLowerCase() === 'no' ? 'No' : 'Yes') : 'Yes';

  const featuredMedia = course?._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://demo.edublink.co/wp-content/themes/edublink/assets/images/course-preview.jpg';
  const cleanExcerpt = course?.excerpt?.rendered ? decodeHTMLEntities(course.excerpt.rendered.replace(/<[^>]+>/g, '')) : '';

  return (
    <main>
      <div className={styles.hn_course_header}>
        <div className={styles.hn_course_header_breadcrumb_wrapper}>
          <div className={styles.hn_course_header_container}>
            <nav className={styles.hn_course_header_breadcrumb_nav}>
              <ul className={styles.hn_course_header_breadcrumb_list}>
                <li className={styles.hn_course_header_breadcrumb_item}>
                  <Link href="/" className={styles.hn_course_header_breadcrumb_link}>
                    Home
                  </Link>
                </li>
                <li className={styles.hn_course_header_breadcrumb_item}>
                  <Link href="/courses" className={styles.hn_course_header_breadcrumb_link}>
                    Course
                  </Link>
                </li>
                <li className={styles.hn_course_header_breadcrumb_item}>
                  <span className={styles.hn_course_header_breadcrumb_active}>
                    {title}
                  </span>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className={styles.hn_course_header_content_wrapper}>
          <div className={styles.hn_course_header_container}>
            <div className={styles.hn_course_header_inner}>
              <div className={styles.hn_course_header_title_box}>
                <h1 className={styles.hn_course_header_title}>
                  {title}
                </h1>
              </div>
              <div className={styles.hn_course_header_meta_box}>
                <ul className={styles.hn_course_header_meta_list}>
                  <li className={`${styles.hn_course_header_meta_item} ${styles.hn_course_header_meta_item_instructor}`}>
                    <i className={`${styles.hn_course_header_meta_icon} icon-58`}></i>
                    By {instructorName}
                  </li>
                  <li className={`${styles.hn_course_header_meta_item} ${styles.hn_course_header_meta_item_category}`}>
                    <i className={`${styles.hn_course_header_meta_icon} icon-59`}></i>
                    <Link href={categoryLink} className={styles.hn_course_header_meta_link}>
                      {categoryName}
                    </Link>
                  </li>
                  <li className={`${styles.hn_course_header_meta_item} ${styles.hn_course_header_meta_item_rating}`}>
                    <div className={styles.hn_course_header_review_wrapper}>
                      {(() => {
                        const headerRatingDetails = (course as any)?.rating_details;
                        const headerAverage = headerRatingDetails?.average ?? 5;
                        const headerTotalReviews = headerRatingDetails?.total ?? 0;

                        return (
                          <>
                            <div className={styles.hn_course_header_review_stars} title={`${headerAverage} out of 5 stars`} style={{ display: 'flex', position: 'relative' }}>
                              {[1, 2, 3, 4, 5].map((starIndex) => {
                                let fillPercent = '0%';
                                if (headerAverage >= starIndex) {
                                  fillPercent = '100%';
                                } else if (headerAverage > starIndex - 1) {
                                  fillPercent = `${Math.round((headerAverage - (starIndex - 1)) * 100)}%`;
                                }

                                return (
                                  <div key={starIndex} className={styles.hn_course_header_review_star}>
                                    <span className={styles.hn_course_header_star_far}>
                                      <svg width="17px" height="16px" viewBox="0 0 17 16" xmlns="http://www.w3.org/2000/svg" className={styles.hn_course_header_star_svg}>
                                        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                          <g fill="#FFB606" fillRule="nonzero">
                                            <path d="M8.5,0 L10.9285714,6.15384615 L17,6.15384615 L11.5357143,9.84615385 L13.9642857,16 L8.5,12.3076923 L3.03571429,16 L5.46428571,9.84615385 L0,6.15384615 L6.07142857,6.15384615 L8.5,0 Z M8.46921775,3.53848077 L7.09419569,7.21637091 L3.96923077,7.21637091 L6.96923077,9.20675852 L5.63589261,12.5384808 L8.46921775,10.5710529 L11.3025689,12.5384808 L9.96921341,9.20675852 L12.9692308,7.21637091 L9.84423981,7.21637091 L8.46921775,3.53848077 Z"></path>
                                          </g>
                                        </g>
                                      </svg>
                                    </span>
                                    <span className={styles.hn_course_header_star_fas} style={{ width: fillPercent }}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="17px" height="16px" viewBox="0 0 17 16" className={styles.hn_course_header_star_svg}>
                                        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                          <g fill="#FFB606" fillRule="nonzero">
                                            <polygon points="8.5 12.3076923 3.03571429 16 5.46428571 9.84615385 0 6.15384615 6.07142857 6.15384615 L8.5 0 10.9285714 6.15384615 L17 6.15384615 L11.5357143 9.84615385 L13.9642857 16"></polygon>
                                          </g>
                                        </g>
                                      </svg>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            <span className={styles.hn_course_header_review_count}>({headerTotalReviews} {headerTotalReviews === 1 ? 'Review' : 'Reviews'})</span>
                          </>
                        );
                      })()}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Shape Dots Section synced with HeadingSectionText */}
        <div className={styles.hn_course_header_shapes}>
          <div className={`${styles.hn_course_header_shape_item} ${styles.hn_course_header_shape_1}`}>
            <span className={styles.hn_course_header_shape_inner}></span>
          </div>
          <div className={`${styles.hn_course_header_shape_item} ${styles.hn_course_header_shape_2}`}>
            <span className={styles.hn_course_header_shape_inner}></span>
          </div>
          <div className={`${styles.hn_course_header_shape_item} ${styles.hn_course_header_shape_3}`}>
            <span
              data-depth="2"
              className={styles.hn_course_header_shape_inner}
              style={{
                transform: `translate3d(${mousePos.x * -2}px, ${mousePos.y * -2}px, 0px) rotate(0.0001deg)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                display: 'block',
              }}
            >
              <Image
                src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/shapes/breadcrumb-shape-1.png"
                alt="Breadcrumb Abstract Shape 1"
                width={186}
                height={186}
                className={styles.hn_course_header_shape_img}
              />
            </span>
          </div>
          <div className={`${styles.hn_course_header_shape_item} ${styles.hn_course_header_shape_4}`}>
            <span
              data-depth="-2"
              className={styles.hn_course_header_shape_inner}
              style={{
                transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0px) rotate(0.0001deg)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                display: 'block',
              }}
            >
              <Image
                src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/shapes/breadcrumb-shape-2.png"
                alt="Breadcrumb Abstract Shape 2"
                width={101}
                height={39}
                className={styles.hn_course_header_shape_img}
              />
            </span>
          </div>
          <div className={`${styles.hn_course_header_shape_item} ${styles.hn_course_header_shape_5}`}>
            <span
              data-depth="2"
              className={styles.hn_course_header_shape_inner}
              style={{
                transform: `translate3d(${mousePos.x * -2}px, ${mousePos.y * -2}px, 0px) rotate(0.0001deg)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                display: 'block',
              }}
            >
              <Image
                src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/shapes/breadcrumb-shape-3.png"
                alt="Breadcrumb Abstract Shape 3"
                width={123}
                height={191}
                className={styles.hn_course_header_shape_img}
              />
            </span>
          </div>
        </div>
      </div>

      {/* Course Details Body Section */}
      <div className={styles.hn_course_details_page}>
        <div className={styles.hn_course_details_container}>
          <div className={styles.hn_course_details_row}>
            {/* Left Column - Main Course Content (8 cols) */}
            <div id="learn-press-course" className={styles.hn_course_details_content_col}>
              <div className={styles.hn_course_details_page_content}>
                <div className={styles.hn_course_details_summary_content}>
                  <div id="learn-press-course-tabs" className={styles.hn_course_details_tabs}>
                    <input
                      type="radio"
                      name="learn-press-course-tab-radio"
                      id="tab-overview-input"
                      checked={activeTab === 'overview'}
                      onChange={() => setActiveTab('overview')}
                      value="overview"
                      className={styles.hn_course_details_tab_radio}
                    />
                    <input
                      type="radio"
                      name="learn-press-course-tab-radio"
                      id="tab-curriculum-input"
                      checked={activeTab === 'curriculum'}
                      onChange={() => setActiveTab('curriculum')}
                      value="curriculum"
                      className={styles.hn_course_details_tab_radio}
                    />
                    <input
                      type="radio"
                      name="learn-press-course-tab-radio"
                      id="tab-instructor-input"
                      checked={activeTab === 'instructor'}
                      onChange={() => setActiveTab('instructor')}
                      value="instructor"
                      className={styles.hn_course_details_tab_radio}
                    />
                    <input
                      type="radio"
                      name="learn-press-course-tab-radio"
                      id="tab-reviews-input"
                      checked={activeTab === 'reviews'}
                      onChange={() => setActiveTab('reviews')}
                      value="reviews"
                      className={styles.hn_course_details_tab_radio}
                    />

                    <ul className={styles.hn_course_details_nav_tabs} data-tabs="4">
                      <li className={`${styles.hn_course_details_nav_tab} ${styles.hn_course_details_nav_tab_overview}`}>
                        <label
                          htmlFor="tab-overview-input"
                          className={`${styles.hn_course_details_tab_label} ${activeTab === 'overview' ? styles.hn_course_details_tab_label_active : ''}`}
                          onClick={() => setActiveTab('overview')}
                        >
                          Overview
                        </label>
                      </li>
                      <li className={`${styles.hn_course_details_nav_tab} ${styles.hn_course_details_nav_tab_curriculum}`}>
                        <label
                          htmlFor="tab-curriculum-input"
                          className={`${styles.hn_course_details_tab_label} ${activeTab === 'curriculum' ? styles.hn_course_details_tab_label_active : ''}`}
                          onClick={() => setActiveTab('curriculum')}
                        >
                          Curriculum
                        </label>
                      </li>
                      <li className={`${styles.hn_course_details_nav_tab} ${styles.hn_course_details_nav_tab_instructor}`}>
                        <label
                          htmlFor="tab-instructor-input"
                          className={`${styles.hn_course_details_tab_label} ${activeTab === 'instructor' ? styles.hn_course_details_tab_label_active : ''}`}
                          onClick={() => setActiveTab('instructor')}
                        >
                          Instructor
                        </label>
                      </li>
                      <li className={`${styles.hn_course_details_nav_tab} ${styles.hn_course_details_nav_tab_reviews}`}>
                        <label
                          htmlFor="tab-reviews-input"
                          className={`${styles.hn_course_details_tab_label} ${activeTab === 'reviews' ? styles.hn_course_details_tab_label_active : ''}`}
                          onClick={() => setActiveTab('reviews')}
                        >
                          Reviews
                        </label>
                      </li>
                    </ul>

                    <div className={styles.hn_course_details_tab_panels}>
                      {/* Tab 1: Overview */}
                      <div className={`${styles.hn_course_details_tab_panel} ${styles.hn_course_details_tab_panel_overview} ${activeTab !== 'overview' ? styles.hn_course_details_tab_panel_hidden : ''}`} id="tab-overview">
                        <div className={styles.hn_course_details_description} id="learn-press-course-description">
                          <h4 className={styles.hn_course_details_section_title}>Course Description</h4>
                          {cleanExcerpt ? (
                            <p className={styles.hn_course_details_paragraph}>{cleanExcerpt}</p>
                          ) : (
                            <>
                              <p className={styles.hn_course_details_paragraph}>
                                Lorem ipsum dolor sit amet consectur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis.
                              </p>
                              <p className={styles.hn_course_details_paragraph}>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis.
                              </p>
                            </>
                          )}
                          <h4 className={styles.hn_course_details_section_title}>What You’ll Learn From This Course</h4>
                          <ul className={styles.hn_course_details_learn_list}>
                            <li className={styles.hn_course_details_learn_item}>Neque sodales ut etiam sit amet nisl purus non tellus orci ac auctor</li>
                            <li className={styles.hn_course_details_learn_item}>Tristique nulla aliquet enim tortor at auctor urna. Sit amet aliquam id diam maer</li>
                            <li className={styles.hn_course_details_learn_item}>Nam libero justo laoreet sit amet. Lacus sed viverra tellus in hac</li>
                            <li className={styles.hn_course_details_learn_item}>Tempus imperdiet nulla malesuada pellentesque elit eget gravida cum sociis</li>
                          </ul>
                          <h4 className={styles.hn_course_details_section_title}>Certification</h4>
                          <p className={styles.hn_course_details_paragraph}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis.
                          </p>
                        </div>
                      </div>

                      {/* Tab 2: Curriculum */}
                      <div className={`${styles.hn_course_details_tab_panel} ${styles.hn_course_details_tab_panel_curriculum} ${activeTab !== 'curriculum' ? styles.hn_course_details_tab_panel_hidden : ''}`} id="tab-curriculum">
                        <div className={styles.hn_course_details_curriculum} id="learn-press-course-curriculum">
                          <div className={styles.hn_course_details_curriculum_scrollable}>
                            {(!((course as any)?.sections) || (course as any).sections.length === 0) ? (
                              <p className={styles.hn_course_details_paragraph} style={{ padding: '15px 0', margin: 0 }}>
                                No curriculum available for this course.
                              </p>
                            ) : (
                              <ul className={styles.hn_course_details_curriculum_sections}>
                                {(course as any).sections.map((section: any, secIdx: number) => {
                                  const sectionIdStr = String(section.section_id || secIdx);
                                  const sectionKey = `section-${sectionIdStr}`;
                                  const isSectionOpen = openSections.includes(sectionKey) || openSections.includes(sectionIdStr);

                                  return (
                                    <li className={styles.hn_course_details_curriculum_section} key={sectionKey} id={sectionKey} data-section-id={sectionIdStr}>
                                      <div
                                        className={styles.hn_course_details_section_header}
                                        onClick={() => toggleSection(sectionKey)}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        <div className={styles.hn_course_details_section_left}>
                                          <h5 className={styles.hn_course_details_curriculum_title}>
                                            {decodeHTMLEntities(section.section_name || section.name)}
                                          </h5>
                                          <span className={styles.hn_course_details_section_toggle}>
                                            {isSectionOpen ? (
                                              <i className={`ri-arrow-up-s-line ${styles.hn_course_details_toggle_icon_up}`}></i>
                                            ) : (
                                              <i className={`ri-arrow-down-s-line ${styles.hn_course_details_toggle_icon_down}`}></i>
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <div className={`${styles.hn_course_details_section_body} ${isSectionOpen ? styles.hn_course_details_section_body_open : ''}`}>
                                        <div className={styles.hn_course_details_section_content_inner}>
                                          <ul className={styles.hn_course_details_section_content}>
                                            {section.items && section.items.map((item: any, itemIdx: number) => {
                                              const itemTitle = decodeHTMLEntities(item.title || item.name || item.post_title);
                                              const isPreview = item.preview === true || item.preview === 'yes' || item.preview === '1';
                                              const durationText = item.duration || '10 minutes';
                                              const itemSlug = item.slug || itemTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                              const itemLink = `/courses/${slug}/lessons/${itemSlug}`;

                                              const isQuiz = item.item_type === 'lp_quiz';
                                              const itemTypeClass = isQuiz ? styles.hn_course_details_course_item_quiz : styles.hn_course_details_course_item_lesson;

                                              return (
                                                <li className={`${styles.hn_course_details_course_item} ${itemTypeClass}`} key={item.item_id || itemIdx} data-id={item.item_id}>
                                                  <Link className={styles.hn_course_details_item_link} href={itemLink}>
                                                    <span className={styles.hn_course_details_item_name}>
                                                      <i className={`${isQuiz ? 'ri-questionnaire-line' : 'icon-65'} ${styles.hn_course_details_item_icon}`}></i>
                                                      {itemTitle}
                                                    </span>
                                                    <div className={styles.hn_course_details_item_meta}>
                                                      {isPreview ? (
                                                        <span className={styles.hn_course_details_item_preview} data-preview="Preview">Preview</span>
                                                      ) : (
                                                        <>
                                                          {item.item_type === 'lp_quiz' && (
                                                            <span className={styles.hn_course_details_item_questions}>2 questions</span>
                                                          )}
                                                          <span className={styles.hn_course_details_item_duration}>{durationText}</span>
                                                          <span className={styles.hn_course_details_item_status} title="Unread"></span>
                                                        </>
                                                      )}
                                                    </div>
                                                  </Link>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tab 3: Instructor */}
                      <div className={`${styles.hn_course_details_tab_panel} ${styles.hn_course_details_tab_panel_instructor} ${activeTab !== 'instructor' ? styles.hn_course_details_tab_panel_hidden : ''}`} id="tab-instructor">
                        <div className={styles.hn_course_details_author_wrapper}>
                          <div className={styles.hn_course_details_author_thumb}>
                            <Image
                              width={270}
                              height={320}
                              src="https://demo.edublink.co/wp-content/uploads/2023/07/team-12.webp"
                              alt={instructorName}
                              className={styles.hn_course_details_author_img}
                            />
                          </div>
                          <div className={styles.hn_course_details_author_details}>
                            <div className={styles.hn_course_details_author_bio_name}>
                              <Link href="#" className={styles.hn_course_details_author_name_link}>
                                <span>{instructorName}</span>
                              </Link>
                            </div>
                            <div className={styles.hn_course_details_author_designation}>
                              <span>Digital Marketer</span>
                            </div>
                            <div className={styles.hn_course_details_author_bio_details}>
                              <p>Consectetur adipisicing elit, sed do eiusmod tempor incididunt labore et dolore magna aliqua enim minim veniam quis nostrud exercitation ulla mco laboris nisi ut aliquip ex ea commodo consequat. duis aute irure dolor in reprehenderit in voluptate.</p>
                            </div>
                            <div className={styles.hn_course_details_author_social}>
                              <Link href="#" target="_blank" className={styles.hn_course_details_author_social_link}><i className="icon-facebook"></i></Link>
                              <Link href="#" target="_blank" className={styles.hn_course_details_author_social_link}><i className="icon-twitter"></i></Link>
                              <Link href="#" target="_blank" className={styles.hn_course_details_author_social_link}><i className="icon-linkedin2"></i></Link>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tab 4: Reviews */}
                      <div className={`${styles.hn_course_details_tab_panel} ${styles.hn_course_details_tab_panel_reviews} ${activeTab !== 'reviews' ? styles.hn_course_details_tab_panel_hidden : ''}`} id="tab-reviews">
                        <div className={styles.hn_course_details_review_box} data-id="12768">
                          <div className={styles.hn_course_details_rating_reviews}>
                            <div className={styles.hn_course_details_course_rate}>
                              {(() => {
                                const ratingDetails = (course as any)?.rating_details;
                                const averageRating = ratingDetails?.average ?? 5;
                                const totalRatings = ratingDetails?.total ?? 0;
                                const starsBreakdown = ratingDetails?.stars || { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
                                const percentsBreakdown = ratingDetails?.percents || { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
                                const reviewsList = ratingDetails?.reviews || [];

                                return (
                                  <>
                                    <div className={styles.hn_course_details_rate_summary}>
                                      <div className={styles.hn_course_details_rate_value}>{averageRating}</div>
                                      <div className={styles.hn_course_details_rate_summary_stars}>
                                        {[1, 2, 3, 4, 5].map((starIdx) => (
                                          <i
                                            key={starIdx}
                                            className="icon-23"
                                            style={{ color: starIdx <= Math.round(averageRating) ? '#ffb60a' : '#d1d5db' }}
                                          ></i>
                                        ))}
                                      </div>
                                      <div className={styles.hn_course_details_rate_summary_text}>
                                        <span>{totalRatings}</span> ratings
                                      </div>
                                    </div>
                                    <div className={styles.hn_course_details_rate_details}>
                                      {/* Rating Rows 5, 4, 3, 2, 1 */}
                                      {[5, 4, 3, 2, 1].map((s) => {
                                        const starKey = String(s) as '5' | '4' | '3' | '2' | '1';
                                        const count = starsBreakdown[starKey] || 0;
                                        const percent = percentsBreakdown[starKey] || 0;
                                        return (
                                          <div key={s} className={styles.hn_course_details_rate_row}>
                                            <span className={styles.hn_course_details_rate_row_star}>
                                              {s} <i className="fas" style={{ color: '#ffb60a' }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-star-fill" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"></path></svg></i>
                                            </span>
                                            <div className={styles.hn_course_details_rate_row_value}>
                                              <div className={styles.hn_course_details_rate_bar_gray}></div>
                                              <div className={styles.hn_course_details_rate_bar_fill} style={{ width: `${percent}%` }} title={`${percent}%`}></div>
                                            </div>
                                            <span className={styles.hn_course_details_rate_count}>{count}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            <div className={styles.hn_course_details_reviews_list_wrapper} id="course-reviews">
                              <h3 className={styles.hn_course_details_reviews_head}>Reviews</h3>
                              {(() => {
                                const reviewsList = (course as any)?.rating_details?.reviews || [];
                                if (reviewsList.length === 0) {
                                  return (
                                    <p style={{ color: '#64748b', fontStyle: 'italic', padding: '16px 0' }}>
                                      Chưa có nhận xét nào cho khóa học này.
                                    </p>
                                  );
                                }
                                return (
                                  <ul className={styles.hn_course_details_reviews_list}>
                                    {reviewsList.map((rev: any) => (
                                      <li key={rev.id} className={styles.hn_course_details_review_item}>
                                        <div className={styles.hn_course_details_review_author_thumb}>
                                          <Image
                                            width={96}
                                            height={96}
                                            unoptimized
                                            src={rev.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'}
                                            alt={rev.author_name}
                                            className={styles.hn_course_details_review_author_img}
                                          />
                                        </div>
                                        <div className={styles.hn_course_details_review_author_info}>
                                          <div className={styles.hn_course_details_review_stars}>
                                            {[1, 2, 3, 4, 5].map((starIdx) => (
                                              <i
                                                key={starIdx}
                                                className="icon-23"
                                                style={{ color: starIdx <= rev.rating ? '#ffb60a' : '#d1d5db' }}
                                              ></i>
                                            ))}
                                          </div>
                                          <div className={styles.hn_course_details_review_top}>
                                            <h4 className={styles.hn_course_details_user_name}>{rev.author_name}</h4>
                                            {rev.date && (
                                              <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '10px' }}>
                                                {new Date(rev.date).toLocaleDateString('vi-VN')}
                                              </span>
                                            )}
                                          </div>
                                          {rev.title && <p className={styles.hn_course_details_review_title}>{rev.title}</p>}
                                          <div className={styles.hn_course_details_review_text}>
                                            <div className={styles.hn_course_details_review_content}>
                                              {rev.content}
                                            </div>
                                          </div>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div id="comments" className={styles.hn_course_details_comments_area}></div>
              </div>
            </div>

            {/* Right Column - Sidebar (4 cols) */}
            <div className={styles.hn_course_details_sidebar_col}>
              <div className={styles.hn_course_details_sidebar}>
                <div className={styles.hn_course_details_sidebar_inner}>
                  <div className={styles.hn_course_details_card_preview} style={{ backgroundImage: `url(${featuredMedia})` }}>
                    <div className={styles.hn_course_details_video_preview}>
                      <Link data-fancybox="" href="https://www.youtube.com/watch?v=m2m5Xx5T4No" className={styles.hn_course_details_video_popup}>
                        <i className="icon-18"></i>
                      </Link>
                    </div>
                  </div>
                  <div className={styles.hn_course_details_sidebar_content}>
                    <h4 className={styles.hn_course_details_widget_title}>Course Includes:</h4>
                    <ul className={styles.hn_course_details_meta_info_list}>
                      <li className={`${styles.hn_course_details_feature_item} ${styles.hn_course_details_feature_item_price}`}>
                        <span className={styles.hn_course_details_feature_label}>
                          <i className="icon-60"></i>Price:
                        </span>
                        <span className={styles.hn_course_details_feature_value}>
                          <div className={styles.hn_course_details_price_wrapper}>
                            <span className={styles.hn_course_details_price_box}>
                              {originPriceDisplay && (
                                <span className={styles.hn_course_details_origin_price} style={{ textDecoration: 'line-through', marginRight: '8px', color: '#a0a0a0' }}>{originPriceDisplay}</span>
                              )}
                              <span className={styles.hn_course_details_price_value}>{priceDisplay}</span>
                            </span>
                          </div>
                        </span>
                      </li>
                      <li className={`${styles.hn_course_details_feature_item} ${styles.hn_course_details_feature_item_instructor}`}>
                        <span className={styles.hn_course_details_feature_label}>
                          <i className="icon-62"></i>Instructor:
                        </span>
                        <span className={styles.hn_course_details_feature_value}>{instructorName}</span>
                      </li>
                      <li className={`${styles.hn_course_details_feature_item} ${styles.hn_course_details_feature_item_duration}`}>
                        <span className={styles.hn_course_details_feature_label}>
                          <i className="icon-61"></i>Duration:
                        </span>
                        <span className={styles.hn_course_details_feature_value}>{durationDisplay}</span>
                      </li>
                      <li className={`${styles.hn_course_details_feature_item} ${styles.hn_course_details_feature_item_lesson}`}>
                        <span className={styles.hn_course_details_feature_label}>
                          <Image
                            src="https://demo.edublink.co/wp-content/themes/edublink/assets/images/icons/books.svg"
                            width={18}
                            height={18}
                            alt="books icon"
                            className={styles.hn_course_details_img_icon}
                          />
                          Lessons:
                        </span>
                        <span className={styles.hn_course_details_feature_value}>{lessonsDisplay}</span>
                      </li>
                      <li className={`${styles.hn_course_details_feature_item} ${styles.hn_course_details_feature_item_student}`}>
                        <span className={styles.hn_course_details_feature_label}>
                          <i className="icon-63"></i>Students:
                        </span>
                        <span className={styles.hn_course_details_feature_value}>{studentsDisplay}</span>
                      </li>
                      <li className={`${styles.hn_course_details_feature_item} ${styles.hn_course_details_feature_item_language}`}>
                        <span className={styles.hn_course_details_feature_label}>
                          <i className="icon-59"></i>Language:
                        </span>
                        <span className={styles.hn_course_details_feature_value}>{languageDisplay}</span>
                      </li>
                      <li className={`${styles.hn_course_details_feature_item} ${styles.hn_course_details_feature_item_certificate}`}>
                        <span className={styles.hn_course_details_feature_label}>
                          <i className="icon-64"></i>Certifications:
                        </span>
                        <span className={styles.hn_course_details_feature_value}>{certificateDisplay}</span>
                      </li>
                    </ul>

                    {(() => {
                      const isFree = priceDisplay === 'Free' || priceDisplay === 'Miễn phí' || priceDisplay === '$0' || priceDisplay === '$0.00' || parseFloat(String(lpPrice || lpRegPrice || 0)) === 0;
                      const firstLessonItem = (course as any)?.sections?.[0]?.items?.[0];
                      const firstLessonSlug = firstLessonItem?.slug || firstLessonItem?.item_id || '1';
                      const lessonUrl = `/courses/${slug}/lessons/${firstLessonSlug}`;
                      const checkoutUrl = `/checkout?course_id=${course?.id || ''}`;

                      const handleAction = async (e: React.FormEvent) => {
                        e.preventDefault();
                        if (isEnrolled) {
                          router.push(lessonUrl);
                        } else if (isFree) {
                          setActionLoading(true);
                          try {
                            await fetch('/api/user/enrollment', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ course_id: course?.id }),
                            });
                            setIsEnrolled(true);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setActionLoading(false);
                          }
                          router.push(lessonUrl);
                        } else {
                          router.push(checkoutUrl);
                        }
                      };

                      let buttonText = 'Buy Now';
                      if (isEnrolled) {
                        buttonText = 'Continue';
                      } else if (isFree) {
                        buttonText = 'Start Now';
                      }

                      return (
                        <div className={styles.hn_course_details_sidebar_buttons}>
                          <div className={styles.hn_course_details_lp_buttons}>
                            <form name="purchase-course" className={styles.hn_course_details_purchase_form} onSubmit={handleAction}>
                              <input type="hidden" name="purchase-course" value={course?.id || "12768"} />
                              <ButtonGreen
                                type="submit"
                                text={actionLoading ? 'Loading...' : buttonText}
                                showIcon={false}
                              />
                            </form>
                          </div>
                        </div>
                      );
                    })()}




                    <div className={styles.hn_course_details_social_share}>
                      <h4 className={styles.hn_course_details_share_title}>Share On:</h4>
                      <ul className={styles.hn_course_details_share_icons_list}>
                        <li className={`${styles.hn_course_details_share_icon_item} ${styles.hn_course_details_share_icon_facebook}`}>
                          <Link className={styles.hn_course_details_share_link} href={`https://www.facebook.com/sharer.php?u=${encodeURIComponent(course?.link || '')}`} target="_blank" title="Share on facebook">
                            <i className="icon-facebook"></i>
                          </Link>
                        </li>
                        <li className={`${styles.hn_course_details_share_icon_item} ${styles.hn_course_details_share_icon_twitter}`}>
                          <Link className={styles.hn_course_details_share_link} href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(course?.link || '')}`} target="_blank" title="Share on Twitter">
                            <i className="icon-twitter"></i>
                          </Link>
                        </li>
                        <li className={`${styles.hn_course_details_share_icon_item} ${styles.hn_course_details_share_icon_linkedin}`}>
                          <Link className={styles.hn_course_details_share_link} href={`https://linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(course?.link || '')}`} target="_blank" title="Share on LinkedIn">
                            <i className="icon-linkedin2"></i>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Courses Section: Courses You May Like */}
      <div className={styles.hn_related_courses}>
        <div className={styles.hn_related_courses_container}>
          <div className={styles.hn_related_courses_section_title}>
            <h3 className={styles.hn_related_courses_title}>Courses You May Like</h3>
          </div>
          <div className={styles.hn_related_courses_items}>
            <Swiper
              modules={[Autoplay, Pagination]}
              slidesPerView={1}
              spaceBetween={30}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              breakpoints={{
                640: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className={styles.hn_related_courses_swiper}
            >
              {relatedCourses.map((relCourse) => {
                const itemTitle = decodeHTMLEntities(relCourse.title?.rendered);
                const featuredImg = relCourse._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://demo.edublink.co/wp-content/uploads/2023/03/course-04-590x430.jpg';
                const cleanExcerpt = relCourse.excerpt?.rendered?.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim() || 'Lorem ipsum dolor sit amet consectur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut...';

                const durationMeta = (relCourse as any)._lp_duration || relCourse.meta?._lp_duration || '15 weeks';
                const levelMeta = (relCourse as any)._lp_level || relCourse.meta?._lp_level || 'Beginner';
                const ratingDetailsMeta = (relCourse as any).rating_details;
                const ratingMeta = (relCourse as any)._lp_rating || relCourse.meta?._lp_rating;
                const salePriceMeta = (relCourse as any)._lp_sale_price || relCourse.meta?._lp_sale_price;
                const regPriceMeta = (relCourse as any)._lp_regular_price || (relCourse as any)._lp_price || relCourse.meta?._lp_regular_price || relCourse.meta?._lp_price;
                const studentsMeta = (relCourse as any)._lp_students || relCourse.meta?._lp_students || '0';
                const lessonsMeta = (relCourse as any)._lp_lessons || relCourse.meta?._lp_lessons || ((relCourse as any).sections ? (relCourse as any).sections.reduce((acc: number, s: any) => acc + (s.items?.filter((it: any) => it.item_type !== 'lp_quiz').length || 0), 0) : '7');

                const relRatingsDisplay = ratingDetailsMeta
                  ? `(${ratingDetailsMeta.average}/ ${ratingDetailsMeta.total} Ratings)`
                  : (ratingMeta ? `(${ratingMeta}/ 5 Ratings)` : `(5.0/ 0 Ratings)`);

                let relPriceDisplay = 'Free';
                let relOriginPriceDisplay: string | undefined = undefined;

                if (salePriceMeta && Number(salePriceMeta) > 0) {
                  relPriceDisplay = `$${salePriceMeta}`;
                  if (regPriceMeta) {
                    relOriginPriceDisplay = `$${regPriceMeta}`;
                  }
                } else if (regPriceMeta !== undefined && regPriceMeta !== '') {
                  relPriceDisplay = parseFloat(String(regPriceMeta)) === 0 ? 'Free' : `$${regPriceMeta}`;
                }

                return (
                  <SwiperSlide key={relCourse.id} className={styles.hn_related_courses_slide}>
                    <CourseCard
                      id={relCourse.id}
                      title={itemTitle}
                      slug={relCourse.slug}
                      imgSrc={featuredImg}
                      link={`/courses/${relCourse.slug}`}
                      duration={durationMeta}
                      level={levelMeta}
                      rating_details={ratingDetailsMeta}
                      ratings={relRatingsDisplay}
                      price={relPriceDisplay}
                      originPrice={relOriginPriceDisplay}
                      lessons={`${lessonsMeta} Lessons`}
                      sections={(relCourse as any).sections}
                      students={`${studentsMeta} Students`}
                      description={cleanExcerpt}
                    />
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </div>
      </div>
    </main>
  );
}