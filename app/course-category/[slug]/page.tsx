import HeadingSectionText from "@/components/common/HeadingSectionText";
import CourseCard from "@/components/common/CourseCard";
import Pagination from "@/components/common/Pagination"; // Import component Pagination vừa tách
import styles from "@/styles/CourseCategory.module.css";
import { notFound } from "next/navigation";

interface CourseCategoryPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

// Helper xóa thẻ HTML để lấy description dạng text thuần
const helperStripHtml = (html?: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').trim();
};

// 1. Fetch thông tin term của taxonomy course_category theo slug
async function getCourseCategoryBySlug(slug: string) {
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;

    try {
        const res = await fetch(`${wpUrl}/wp-json/wp/v2/course_category?slug=${slug}`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return null;

        const categories = await res.json();
        return categories.length > 0 ? categories[0] : null;
    } catch (error) {
        console.error("Error fetching course category:", error);
        return null;
    }
}

// 2. Fetch danh sách bài viết thuộc post_type=lp_course từ WordPress REST API
async function getLpCoursesByCategory(categoryId: number, page: number = 1, perPage: number = 9) {
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;

    try {
        const res = await fetch(
            `${wpUrl}/wp-json/wp/v2/lp_course?_embed&course_category=${categoryId}&per_page=${perPage}&page=${page}`,
            { next: { revalidate: 60 } }
        );

        if (!res.ok) {
            return { courses: [], totalCourses: 0, totalPages: 1 };
        }

        const courses = await res.json();
        const totalCourses = parseInt(res.headers.get('X-WP-Total') || '0', 10);
        const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);

        return { courses, totalCourses, totalPages };
    } catch (error) {
        console.error("Error fetching lp_course items:", error);
        return { courses: [], totalCourses: 0, totalPages: 1 };
    }
}

export default async function CourseCategoryPage({ params, searchParams }: CourseCategoryPageProps) {
    const { slug } = await params;
    const resolvedParams = await searchParams;
    const currentPage = parseInt(resolvedParams?.page || '1', 10);
    const perPage = 9;

    // Lấy thông tin danh mục
    const categoryInfo = await getCourseCategoryBySlug(slug);

    if (!categoryInfo) {
        notFound();
    }

    // Lấy danh sách khóa học thuộc danh mục này
    const { courses, totalCourses, totalPages } = await getLpCoursesByCategory(categoryInfo.id, currentPage, perPage);

    // Decode tên danh mục HTML entities
    const categoryName = categoryInfo.name
        ? categoryInfo.name.replace(/&#(\d+);/g, (_: string, dec: number) => String.fromCharCode(dec))
        : "Category";

    // Tính số lượng bài viết đang hiển thị (Ví dụ: Showing 1-9 Of 15 Results)
    const startCount = totalCourses === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const endCount = Math.min(currentPage * perPage, totalCourses);

    return (
        <main>
            <HeadingSectionText
                title={`Category: ${categoryName}`}
                breadcrumb={[
                    { label: "Home", href: "/" },
                    { label: "Courses", href: "/courses" },
                    { label: categoryName }
                ]}
            />

            <section className={styles.hn__courseCategory}>
                <div className={styles.hn__courseCategory_container}>
                    <div className={styles.hn__courseCategory_inner}>

                        {/* THANH CÔNG CỤ TRÊN (TOP BAR) */}
                        <header className={styles.hn__courseCategory_topBar}>
                            <div className={styles.hn__courseCategory_topBarRow}>
                                <div className={styles.hn__courseCategory_countCol}>
                                    <p className={styles.hn__courseCategory_indexCount}>
                                        Showing <span>{startCount}-{endCount}</span> Of <span>{totalCourses}</span> Results
                                    </p>
                                </div>
                                <div className={styles.hn__courseCategory_searchCol}>
                                    <div className={styles.hn__courseCategory_searchBox}>
                                        <form
                                            className={styles.hn__courseCategory_searchForm}
                                            action="/courses"
                                            method="get"
                                            role="search"
                                        >
                                            <label
                                                htmlFor="hn__courseCategory_searchInput"
                                                className={styles.hn__courseCategory_srOnly}
                                            >
                                                Search Courses
                                            </label>
                                            <input
                                                type="search"
                                                id="hn__courseCategory_searchInput"
                                                name="search_query"
                                                className={styles.hn__courseCategory_searchInput}
                                                placeholder="Search Courses..."
                                                required
                                            />
                                            <button
                                                type="submit"
                                                className={styles.hn__courseCategory_searchBtn}
                                                aria-label="Search"
                                            >
                                                <i className="icon-2" aria-hidden="true"></i>
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* LƯỚI KHÓA HỌC DÙNG CourseCard ĐỔ DỮ LIỆU CHUẨN XÁC */}
                        <div className={styles.hn__courseCategory_grid}>
                            {courses.length > 0 ? (
                                courses.map((item: any, index: number) => {
                                    // 1. Ảnh đại diện
                                    const featuredImg = item._embedded?.['wp:featuredmedia']?.[0]?.source_url;
                                    const categoryName = item._embedded?.['wp:term']?.[0]?.[0]?.name;
                                    const cleanExcerpt = helperStripHtml(item.excerpt?.rendered);

                                    // 2. Meta từ LearnPress
                                    const durationMeta = item._lp_duration || item.meta?._lp_duration;
                                    const levelMeta = item._lp_level || item.meta?._lp_level || 'Beginner';
                                    const salePriceMeta = item._lp_sale_price || item.meta?._lp_sale_price;
                                    const regPriceMeta = item._lp_regular_price || item._lp_price || item.meta?._lp_regular_price || item.meta?._lp_price;
                                    const studentsMeta = item._lp_students || item.meta?._lp_students;
                                    const ratingMeta = item._lp_rating || item.meta?._lp_rating;

                                    // 3. Tính số lượng bài học (Lessons) trừ Quiz
                                    const sectionsArr = item.sections;
                                    let calculatedLessonsCount: number | undefined = undefined;

                                    if (sectionsArr && Array.isArray(sectionsArr)) {
                                        calculatedLessonsCount = sectionsArr.reduce((acc: number, sec: any) => {
                                            const lessonItemsOnly = sec.items ? sec.items.filter((it: any) => it.item_type !== 'lp_quiz') : [];
                                            return acc + lessonItemsOnly.length;
                                        }, 0);
                                    }

                                    const lessonsMeta = item._lp_lessons || item.meta?._lp_lessons;
                                    const displayLessonsText = (calculatedLessonsCount !== undefined && calculatedLessonsCount > 0)
                                        ? `${calculatedLessonsCount} Lessons`
                                        : (lessonsMeta ? `${lessonsMeta} Lessons` : '7 Lessons');

                                    // 4. Giá tiền
                                    let displayPrice: string | number = '$30';
                                    let displayOriginPrice: string | undefined = undefined;

                                    if (salePriceMeta && Number(salePriceMeta) > 0) {
                                        displayPrice = `$${salePriceMeta}`;
                                        displayOriginPrice = regPriceMeta ? `$${regPriceMeta}` : undefined;
                                    } else if (regPriceMeta && Number(regPriceMeta) > 0) {
                                        displayPrice = `$${regPriceMeta}`;
                                    } else if (regPriceMeta === '0' || regPriceMeta === 0) {
                                        displayPrice = 'Free';
                                    } else {
                                        displayPrice = `$${30 + (index % 6) * 10}`;
                                        displayOriginPrice = index % 2 === 0 ? `$${45 + (index % 6) * 10}` : undefined;
                                    }

                                    // 5. Ratings Text
                                    const displayRatings = item.rating_details
                                        ? `(${item.rating_details.average}/ ${item.rating_details.total} Ratings)`
                                        : (ratingMeta ? `(${ratingMeta}/ 5 Ratings)` : `(5.0/ 0 Ratings)`);

                                    return (
                                        <div key={item.id} className={styles.hn__courseCategory_item}>
                                            <CourseCard
                                                id={item.id}
                                                title={item.title?.rendered || ''}
                                                imgSrc={featuredImg || `https://demo.edublink.co/wp-content/uploads/2023/03/course-0${(index % 5) + 1}-590x430.jpg`}
                                                link={`/courses/${item.slug}`}
                                                slug={item.slug}
                                                duration={durationMeta || `${10 + (index % 5) * 2} weeks`}
                                                level={levelMeta || categoryName || 'Beginner'}
                                                ratings={displayRatings}
                                                rating_details={item.rating_details}
                                                price={displayPrice}
                                                originPrice={displayOriginPrice}
                                                lessons={displayLessonsText}
                                                sections={sectionsArr}
                                                students={studentsMeta ? `${studentsMeta} Students` : `${120 + index * 35} Students`}
                                                post_excerpt={cleanExcerpt || 'Lorem ipsum dolor sit amet consectur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut...'}
                                            />
                                        </div>
                                    );
                                })
                            ) : (
                                <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 0', color: '#666' }}>
                                    No courses found in this category.
                                </p>
                            )}
                        </div>

                        {/* COMPONENT PHÂN TRANG (PAGINATION) */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            baseUrl={`/course-category/${slug}`}
                        />

                    </div>
                </div>
            </section>
        </main>
    );
}