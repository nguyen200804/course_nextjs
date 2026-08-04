'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HeadingSectionText from '@/components/common/HeadingSectionText';
import LazyLoad from '@/components/common/LazyLoad';
import CourseCard from '@/components/common/CourseCard';
import CourseCardList from '@/components/common/CourseCardList';
import Pagination from '@/components/common/Pagination'; // Import component Pagination
import ButtonGreen from '@/components/common/ButtonGreen';
import { fetchWPCourses, fetchLPCategories, fetchWPLevelCounts, fetchWPInstructors, fetchWPPriceCounts, WPLPCourseItem } from '@/lib/api/courses';
import styles from './CoursePage.module.css';

interface CourseUI {
    id: number;
    title: string;
    image: string;
    level: string;
    duration: string;
    ratings: string;
    price: string;
    originPrice?: string;
    lessons: string;
    sections?: any[];
    students: string;
    description: string;
    link: string;
    slug?: string;
    categoryId?: number;
    instructorId?: number;
    isFree?: boolean;
}

const helperStripHtml = (html?: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').trim();
};

const defaultLevels = [
    { label: 'All Levels', count: 0 },
    { label: 'Beginner', count: 0 },
    { label: 'Intermediate', count: 0 },
    { label: 'Expert', count: 0 },
];

function CoursesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read Page & URL Parameters
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

    const activeCatParam = searchParams.get('category');
    const activeInsParam = searchParams.get('instructor');
    const activeLvlParam = searchParams.get('level');
    const activePriceParam = (searchParams.get('price') as 'all' | 'free' | 'paid') || 'all';
    const activeSortParam = searchParams.get('sort') || '';

    // Active Applied Filters derived from URL
    const activeCategories = useMemo(
        () => (activeCatParam ? activeCatParam.split(',').map(Number) : []),
        [activeCatParam]
    );
    const activeInstructors = useMemo(
        () => (activeInsParam ? activeInsParam.split(',').map(Number) : []),
        [activeInsParam]
    );
    const activeLevels = useMemo(
        () => (activeLvlParam ? activeLvlParam.split(',') : []),
        [activeLvlParam]
    );

    // State chọn chế độ hiển thị: 'grid' hoặc 'list'
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Draft Selection States (User picks before clicking "Apply Filter")
    const [draftCategories, setDraftCategories] = useState<number[]>(activeCategories);
    const [draftInstructors, setDraftInstructors] = useState<number[]>(activeInstructors);
    const [draftLevels, setDraftLevels] = useState<string[]>(activeLevels);
    const [draftPrice, setDraftPrice] = useState<'all' | 'free' | 'paid'>(activePriceParam);
    const [sortOption, setSortOption] = useState<string>(activeSortParam);

    // Filter Widget Collapse/Expand States (All expanded by default)
    const [openWidgets, setOpenWidgets] = useState<{ [key: string]: boolean }>({
        categories: true,
        instructor: true,
        level: true,
        price: true,
    });

    const toggleWidget = (key: string) => {
        setOpenWidgets((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // Sync draft states when URL searchParams change
    useEffect(() => {
        setDraftCategories(activeCategories);
        setDraftInstructors(activeInstructors);
        setDraftLevels(activeLevels);
        setDraftPrice(activePriceParam);
        setSortOption(activeSortParam);
    }, [activeCategories, activeInstructors, activeLevels, activePriceParam, activeSortParam]);

    // Data States
    const [displayedCourses, setDisplayedCourses] = useState<CourseUI[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string; count: number; slug: string }[]>([]);
    const [instructors, setInstructors] = useState<{ id: number; name: string; count: number }[]>([]);
    const [levels, setLevels] = useState<{ label: string; count: number }[]>(defaultLevels);
    const [priceCounts, setPriceCounts] = useState<{ all: number; free: number; paid: number }>({ all: 0, free: 0, paid: 0 });
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCourses, setTotalCourses] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Fetch post_type=lp_course from WordPress REST API with filter params
    useEffect(() => {
        async function loadAPIData() {
            setIsLoading(true);
            const isClientFiltered = activeLevels.length > 0 || activePriceParam !== 'all';

            const wpRes = await fetchWPCourses({
                page: isClientFiltered ? 1 : currentPage,
                perPage: isClientFiltered ? 100 : 9,
                category: activeCategories,
                instructor: activeInstructors,
                sort: activeSortParam,
            });

            if (wpRes && wpRes.courses) {
                let apiCourses: CourseUI[] = wpRes.courses.map((item: WPLPCourseItem, index: number) => {
                    const featuredImg = item._embedded?.['wp:featuredmedia']?.[0]?.source_url;
                    const termObj = item._embedded?.['wp:term']?.[0]?.[0];
                    const categoryName = termObj?.name;
                    const categoryId = termObj?.id;
                    const authorObj = item._embedded?.['author']?.[0];
                    const cleanExcerpt = helperStripHtml(item.excerpt?.rendered);

                    const durationMeta = (item as any)._lp_duration || item.meta?._lp_duration;
                    const levelMeta = (item as any)._lp_level || item.meta?._lp_level || 'Beginner';
                    const salePriceMeta = (item as any)._lp_sale_price || item.meta?._lp_sale_price;
                    const regPriceMeta = (item as any)._lp_regular_price || (item as any)._lp_price || item.meta?._lp_regular_price || item.meta?._lp_price;
                    const studentsMeta = (item as any)._lp_students || item.meta?._lp_students;
                    const ratingMeta = (item as any)._lp_rating || item.meta?._lp_rating;

                    const sectionsArr = (item as any).sections || item.sections;
                    let calculatedLessonsCount: number | undefined = undefined;

                    if (sectionsArr && Array.isArray(sectionsArr)) {
                        calculatedLessonsCount = sectionsArr.reduce((acc: number, sec: any) => {
                            const lessonItemsOnly = sec.items ? sec.items.filter((it: any) => it.item_type !== 'lp_quiz') : [];
                            return acc + lessonItemsOnly.length;
                        }, 0);
                    }

                    const lessonsMeta = (item as any)._lp_lessons || item.meta?._lp_lessons;
                    const displayLessonsText = (calculatedLessonsCount !== undefined && calculatedLessonsCount > 0)
                        ? `${calculatedLessonsCount} Lessons`
                        : (lessonsMeta ? `${lessonsMeta} Lessons` : '7 Lessons');

                    let displayPrice = '$30';
                    let displayOriginPrice: string | undefined = undefined;
                    let isFree = false;

                    if (salePriceMeta && Number(salePriceMeta) > 0) {
                        displayPrice = `$${salePriceMeta}`;
                        displayOriginPrice = regPriceMeta ? `$${regPriceMeta}` : undefined;
                    } else if (regPriceMeta && Number(regPriceMeta) > 0) {
                        displayPrice = `$${regPriceMeta}`;
                    } else if (regPriceMeta === '0' || regPriceMeta === 0) {
                        displayPrice = 'Free';
                        isFree = true;
                    } else {
                        displayPrice = `$${30 + (index % 6) * 10}`;
                        displayOriginPrice = index % 2 === 0 ? `$${45 + (index % 6) * 10}` : undefined;
                    }

                    return {
                        id: item.id,
                        title: item.title.rendered,
                        image: featuredImg || `https://demo.edublink.co/wp-content/uploads/2023/03/course-0${(index % 5) + 1}-590x430.jpg`,
                        level: levelMeta || categoryName || 'Beginner',
                        duration: durationMeta || `${10 + (index % 5) * 2} weeks`,
                        ratings: item.rating_details
                            ? `(${item.rating_details.average}/ ${item.rating_details.total} Ratings)`
                            : (ratingMeta ? `(${ratingMeta}/ 5 Ratings)` : `(5.0/ 0 Ratings)`),
                        rating_details: item.rating_details,
                        price: displayPrice,
                        originPrice: displayOriginPrice,
                        lessons: displayLessonsText,
                        sections: sectionsArr,
                        students: studentsMeta ? `${studentsMeta} Students` : `${120 + index * 35} Students`,
                        description: cleanExcerpt || 'Lorem ipsum dolor sit amet consectur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut...',
                        link: `/courses/${item.slug}`,
                        slug: item.slug,
                        categoryId: categoryId,
                        instructorId: authorObj?.id,
                        isFree: isFree,
                    };
                });

                if (isClientFiltered) {
                    if (activeLevels.length > 0) {
                        apiCourses = apiCourses.filter((course) =>
                            activeLevels.some((lvl) => {
                                if (lvl === 'All Levels') {
                                    return course.level.toLowerCase().includes('all');
                                }
                                return course.level.toLowerCase().includes(lvl.toLowerCase());
                            })
                        );
                    }

                    if (activePriceParam === 'free') {
                        apiCourses = apiCourses.filter((course) => course.isFree || course.price === 'Free');
                    } else if (activePriceParam === 'paid') {
                        apiCourses = apiCourses.filter((course) => !course.isFree && course.price !== 'Free');
                    }

                    setTotalCourses(apiCourses.length);
                    setTotalPages(Math.ceil(apiCourses.length / 9) || 1);
                    setDisplayedCourses(apiCourses.slice((currentPage - 1) * 9, currentPage * 9));
                } else {
                    setTotalCourses(wpRes.total);
                    setTotalPages(wpRes.totalPages);
                    setDisplayedCourses(apiCourses);
                }
            } else {
                setDisplayedCourses([]);
                setTotalCourses(0);
                setTotalPages(1);
            }
            setIsLoading(false);
        }

        loadAPIData();
    }, [currentPage, activeCategories, activeInstructors, activeLevels, activePriceParam, activeSortParam]);

    // Fetch Instructors
    useEffect(() => {
        async function loadInstructors() {
            const insRes = await fetchWPInstructors();
            if (Array.isArray(insRes)) {
                setInstructors(insRes);
            }
        }

        loadInstructors();
    }, []);

    // Fetch Level Counts
    useEffect(() => {
        async function loadLevelCounts() {
            const levelCounts = await fetchWPLevelCounts();
            if (levelCounts) {
                setLevels([
                    { label: 'All Levels', count: levelCounts['All Levels'] || 0 },
                    { label: 'Beginner', count: levelCounts['Beginner'] || 0 },
                    { label: 'Intermediate', count: levelCounts['Intermediate'] || 0 },
                    { label: 'Expert', count: levelCounts['Expert'] || 0 },
                ]);
            }
        }

        loadLevelCounts();
    }, []);

    // Fetch Price Counts
    useEffect(() => {
        async function loadPriceCounts() {
            const prices = await fetchWPPriceCounts();
            if (prices) {
                setPriceCounts(prices);
            }
        }

        loadPriceCounts();
    }, []);

    // Fetch Categories
    useEffect(() => {
        async function loadCategories() {
            const catRes = await fetchLPCategories();
            if (Array.isArray(catRes) && catRes.length > 0) {
                const apiCategories = catRes.map((c: any) => ({
                    id: c.id,
                    name: c.name?.replace(/&#038;/g, '&').replace(/&amp;/g, '&') || c.name,
                    count: c.count || 0,
                    slug: c.slug,
                }));
                setCategories(apiCategories);
            }
        }

        loadCategories();
    }, []);

    // Draft Selection Toggles
    const handleCategoryToggle = (id: number) => {
        setDraftCategories((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleInstructorToggle = (id: number) => {
        setDraftInstructors((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleLevelToggle = (label: string) => {
        setDraftLevels((prev) =>
            prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
        );
    };

    // Trigger URL Filter on "Apply Filter"
    const handleApplyFilter = () => {
        const params = new URLSearchParams();
        params.set('page', '1');

        if (draftCategories.length > 0) {
            params.set('category', draftCategories.join(','));
        }
        if (draftInstructors.length > 0) {
            params.set('instructor', draftInstructors.join(','));
        }
        if (draftLevels.length > 0) {
            params.set('level', draftLevels.join(','));
        }
        if (draftPrice !== 'all') {
            params.set('price', draftPrice);
        }
        if (sortOption) {
            params.set('sort', sortOption);
        }

        router.push(`/courses?${params.toString()}`);
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    // Reset Filters to initial URL state
    const handleResetFilters = () => {
        setDraftCategories([]);
        setDraftInstructors([]);
        setDraftLevels([]);
        setDraftPrice('all');
        setSortOption('');
        router.push('/courses?page=1');
    };

    // Top Sort Change
    const handleSortChange = (newSort: string) => {
        setSortOption(newSort);
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');
        if (newSort) {
            params.set('sort', newSort);
        } else {
            params.delete('sort');
        }
        router.push(`/courses?${params.toString()}`);
    };

    // Push new page to URL query parameter
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', page.toString());
            router.push(`/courses?${params.toString()}`);
            window.scrollTo({ top: 300, behavior: 'smooth' });
        }
    };

    // Calculate dynamic pagination text numbers
    const startCount = totalCourses === 0 ? 0 : (currentPage - 1) * 9 + 1;
    const endCount = Math.min(currentPage * 9, totalCourses);

    return (
        <section className={styles.hn_course_page}>
            <div className={styles.hn_course_page__container}>
                <div className={styles.hn_course_page__row}>

                    {/* Sidebar Column (Left) */}
                    <aside className={styles.hn_course_page__sidebar_column}>
                        <div className={styles.hn_course_page__sidebar_toggle}>
                            <i className="icon-55" /> Filter Sidebar
                        </div>

                        <div className={styles.hn_course_page__sidebar_wrapper}>
                            {/* Categories Filter */}
                            <div className={styles.hn_course_page__filter_widget}>
                                <h4
                                    className={styles.hn_course_page__widget_title}
                                    onClick={() => toggleWidget('categories')}
                                >
                                    <span>Categories</span>
                                    <svg
                                        className={`${styles.hn_course_page__widget_arrow} ${openWidgets.categories ? styles.hn_course_page__widget_arrow_open : ''
                                            }`}
                                        width="12"
                                        height="8"
                                        viewBox="0 0 12 8"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M1 1.5L6 6.5L11 1.5"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </h4>
                                <div
                                    className={`${styles.hn_course_page__filter_content_wrapper} ${openWidgets.categories ? styles.hn_course_page__filter_content_wrapper_open : ''
                                        }`}
                                >
                                    <div className={styles.hn_course_page__filter_content}>
                                        {categories.map((cat) => (
                                            <label key={cat.id} className={styles.hn_course_page__filter_item}>
                                                <input
                                                    type="checkbox"
                                                    checked={draftCategories.includes(cat.id)}
                                                    onChange={() => handleCategoryToggle(cat.id)}
                                                    className={styles.hn_course_page__filter_input}
                                                />
                                                <span className={styles.hn_course_page__filter_text}>{cat.name}</span>
                                                <span className={styles.hn_course_page__filter_count}>({cat.count})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Instructor Filter */}
                            <div className={styles.hn_course_page__filter_widget}>
                                <h4
                                    className={styles.hn_course_page__widget_title}
                                    onClick={() => toggleWidget('instructor')}
                                >
                                    <span>Instructor</span>
                                    <svg
                                        className={`${styles.hn_course_page__widget_arrow} ${openWidgets.instructor ? styles.hn_course_page__widget_arrow_open : ''
                                            }`}
                                        width="12"
                                        height="8"
                                        viewBox="0 0 12 8"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M1 1.5L6 6.5L11 1.5"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </h4>
                                <div
                                    className={`${styles.hn_course_page__filter_content_wrapper} ${openWidgets.instructor ? styles.hn_course_page__filter_content_wrapper_open : ''
                                        }`}
                                >
                                    <div className={styles.hn_course_page__filter_content}>
                                        {instructors.map((ins) => (
                                            <label key={ins.id} className={styles.hn_course_page__filter_item}>
                                                <input
                                                    type="checkbox"
                                                    checked={draftInstructors.includes(ins.id)}
                                                    onChange={() => handleInstructorToggle(ins.id)}
                                                    className={styles.hn_course_page__filter_input}
                                                />
                                                <span className={styles.hn_course_page__filter_text}>{ins.name}</span>
                                                <span className={styles.hn_course_page__filter_count}>({ins.count})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Level Filter */}
                            <div className={styles.hn_course_page__filter_widget}>
                                <h4
                                    className={styles.hn_course_page__widget_title}
                                    onClick={() => toggleWidget('level')}
                                >
                                    <span>Level</span>
                                    <svg
                                        className={`${styles.hn_course_page__widget_arrow} ${openWidgets.level ? styles.hn_course_page__widget_arrow_open : ''
                                            }`}
                                        width="12"
                                        height="8"
                                        viewBox="0 0 12 8"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M1 1.5L6 6.5L11 1.5"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </h4>
                                <div
                                    className={`${styles.hn_course_page__filter_content_wrapper} ${openWidgets.level ? styles.hn_course_page__filter_content_wrapper_open : ''
                                        }`}
                                >
                                    <div className={styles.hn_course_page__filter_content}>
                                        {levels.map((lvl, i) => (
                                            <label key={i} className={styles.hn_course_page__filter_item}>
                                                <input
                                                    type="checkbox"
                                                    checked={draftLevels.includes(lvl.label)}
                                                    onChange={() => handleLevelToggle(lvl.label)}
                                                    className={styles.hn_course_page__filter_input}
                                                />
                                                <span className={styles.hn_course_page__filter_text}>{lvl.label}</span>
                                                <span className={styles.hn_course_page__filter_count}>({lvl.count})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Price Filter */}
                            <div className={styles.hn_course_page__filter_widget}>
                                <h4
                                    className={styles.hn_course_page__widget_title}
                                    onClick={() => toggleWidget('price')}
                                >
                                    <span>Price</span>
                                    <svg
                                        className={`${styles.hn_course_page__widget_arrow} ${openWidgets.price ? styles.hn_course_page__widget_arrow_open : ''
                                            }`}
                                        width="12"
                                        height="8"
                                        viewBox="0 0 12 8"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M1 1.5L6 6.5L11 1.5"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </h4>
                                <div
                                    className={`${styles.hn_course_page__filter_content_wrapper} ${openWidgets.price ? styles.hn_course_page__filter_content_wrapper_open : ''
                                        }`}
                                >
                                    <div className={styles.hn_course_page__filter_content}>
                                        <label className={styles.hn_course_page__filter_item}>
                                            <input
                                                type="radio"
                                                name="course_price"
                                                checked={draftPrice === 'all'}
                                                onChange={() => setDraftPrice('all')}
                                                className={styles.hn_course_page__filter_input}
                                            />
                                            <span className={styles.hn_course_page__filter_text}>All</span>
                                            <span className={styles.hn_course_page__filter_count}>({priceCounts.all})</span>
                                        </label>
                                        <label className={styles.hn_course_page__filter_item}>
                                            <input
                                                type="radio"
                                                name="course_price"
                                                checked={draftPrice === 'free'}
                                                onChange={() => setDraftPrice('free')}
                                                className={styles.hn_course_page__filter_input}
                                            />
                                            <span className={styles.hn_course_page__filter_text}>Free</span>
                                            <span className={styles.hn_course_page__filter_count}>({priceCounts.free})</span>
                                        </label>
                                        <label className={styles.hn_course_page__filter_item}>
                                            <input
                                                type="radio"
                                                name="course_price"
                                                checked={draftPrice === 'paid'}
                                                onChange={() => setDraftPrice('paid')}
                                                className={styles.hn_course_page__filter_input}
                                            />
                                            <span className={styles.hn_course_page__filter_text}>Paid</span>
                                            <span className={styles.hn_course_page__filter_count}>({priceCounts.paid})</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Filter Buttons */}
                            <div className={styles.hn_course_page__filter_buttons}>
                                <ButtonGreen
                                    type="button"
                                    onClick={handleApplyFilter}
                                    text="Apply Filter"
                                    showIcon={false}
                                    className={styles.hn_course_page__apply_btn}
                                />
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className={styles.hn_course_page__reset_btn}
                                >
                                    Reset Filter
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Column (Right) */}
                    <div className={styles.hn_course_page__content_column}>
                        {/* Top Sorting Bar */}
                        <div className={styles.hn_course_page__top_sorting}>
                            <div className={styles.hn_course_page__sorting_left}>
                                <h6 className={styles.hn_course_page__course_found}>
                                    Showing{' '}
                                    <span className={styles.hn_course_page__count_highlight}>
                                        {startCount}-{endCount}
                                    </span>{' '}
                                    Of{' '}
                                    <span className={styles.hn_course_page__count_highlight}>
                                        {totalCourses}
                                    </span>{' '}
                                    Courses
                                </h6>
                            </div>
                            <div className={styles.hn_course_page__sorting_right}>
                                <div className={styles.hn_course_page__layout_switcher}>
                                    <span className={styles.hn_course_page__layout_label}>
                                        {viewMode === 'grid' ? 'Grid' : 'List'}
                                    </span>
                                    <ul className={styles.hn_course_page__switcher_btn_list}>
                                        <li>
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('grid')}
                                                className={`${styles.hn_course_page__switcher_btn} ${viewMode === 'grid' ? styles.hn_course_page__switcher_btn_active : ''
                                                    }`}
                                                aria-label="Grid View"
                                            >
                                                <i className="icon-53" />
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('list')}
                                                className={`${styles.hn_course_page__switcher_btn} ${viewMode === 'list' ? styles.hn_course_page__switcher_btn_active : ''
                                                    }`}
                                                aria-label="List View"
                                            >
                                                <i className="icon-54" />
                                            </button>
                                        </li>
                                    </ul>
                                </div>

                                <div className={styles.hn_course_page__course_sorting_select}>
                                    <i className={`icon-55 ${styles.hn_course_page__select_icon}`} />
                                    <select
                                        className={styles.hn_course_page__select}
                                        value={sortOption}
                                        onChange={(e) => handleSortChange(e.target.value)}
                                    >
                                        <option value="">Filters</option>
                                        <option value="newest">Newest</option>
                                        <option value="oldest">Oldest</option>
                                        <option value="az">Course Title (a-z)</option>
                                        <option value="za">Course Title (z-a)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Danh sách bài viết - Render theo Grid hoặc List */}
                        <div className={viewMode === 'grid' ? styles.hn_course_page__grid : styles.hn_course_page__list}>
                            {isLoading ? (
                                Array.from({ length: 9 }).map((_, index) => (
                                    <div key={index} className={styles.hn_course_page__skeleton_card} />
                                ))
                            ) : displayedCourses.length > 0 ? (
                                displayedCourses.map((course) =>
                                    viewMode === 'grid' ? (
                                        <CourseCard
                                            key={course.id}
                                            id={course.id}
                                            title={course.title}
                                            imgSrc={course.image}
                                            link={course.link}
                                            duration={course.duration}
                                            level={course.level}
                                            ratings={course.ratings}
                                            price={course.price}
                                            originPrice={course.originPrice}
                                            lessons={course.lessons}
                                            sections={course.sections}
                                            students={course.students}
                                            description={course.description}
                                        />
                                    ) : (
                                        <CourseCardList
                                            key={course.id}
                                            id={course.id}
                                            title={course.title}
                                            imgSrc={course.image}
                                            link={course.link}
                                            duration={course.duration}
                                            level={course.level}
                                            ratings={course.ratings}
                                            price={course.price}
                                            originPrice={course.originPrice}
                                            lessons={course.lessons}
                                            sections={course.sections}
                                            students={course.students}
                                            description={course.description}
                                        />
                                    )
                                )
                            ) : (
                                <div className={styles.hn_course_page__no_results}>
                                    <i className="icon-55" style={{ fontSize: '42px', color: '#1ab69d', marginBottom: '15px', display: 'inline-block' }} />
                                    <h4 className={styles.hn_course_page__no_results_title}>No Courses Found</h4>
                                    <p className={styles.hn_course_page__no_results_desc}>
                                        We couldn't find any courses matching your filter criteria. Try adjusting or resetting your filters.
                                    </p>
                                    <ButtonGreen
                                        type="button"
                                        onClick={handleResetFilters}
                                        text="Reset Filters"
                                        showIcon={false}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Thay thế phần Phân trang bằng Component Pagination */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            baseUrl="/courses"
                            onChangePage={handlePageChange}
                        />

                    </div>

                </div>
            </div>
        </section>
    );
}

export default function CoursesPage() {
    return (
        <main>
            {/* Header Banner */}
            <HeadingSectionText title="Courses" breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Courses' }]} />

            {/* Courses Page Content wrapped in Suspense for searchParams */}
            <Suspense fallback={<div>Loading...</div>}>
                <CoursesContent />
            </Suspense>
        </main>
    );
}