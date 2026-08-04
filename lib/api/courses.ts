export interface RatingDetails {
    average: number;
    total: number;
    stars: {
        '5': number;
        '4': number;
        '3': number;
        '2': number;
        '1': number;
    };
    percents: {
        '5': number;
        '4': number;
        '3': number;
        '2': number;
        '1': number;
    };
    reviews: Array<{
        id: number;
        author_name: string;
        author_avatar: string;
        rating: number;
        title: string;
        content: string;
        date: string;
    }>;
}

export interface WPLPCourseItem {
    id: number;
    title: {
        rendered: string;
    };
    slug: string;
    link: string;
    excerpt?: {
        rendered: string;
    };
    featured_media: number;
    sections?: any[];
    rating_details?: RatingDetails;
    meta?: {
        _lp_duration?: string;
        _lp_level?: string;
        _lp_price?: string;
        _lp_regular_price?: string;
        _lp_sale_price?: string;
        _lp_students?: string | number;
        _lp_rating?: string | number;
        [key: string]: any;
    };
    _embedded?: {
        'wp:featuredmedia'?: Array<{
            source_url: string;
            media_details?: {
                sizes?: {
                    medium?: { source_url: string };
                    large?: { source_url: string };
                };
            };
        }>;
        'wp:term'?: Array<Array<{
            id: number;
            name: string;
            slug: string;
        }>>;
        author?: Array<{
            id: number;
            name: string;
        }>;
    };
}

export interface WPLPCoursesResponse {
    courses: WPLPCourseItem[];
    total: number;
    totalPages: number;
}

export interface FetchCoursesParams {
    page?: number;
    perPage?: number;
    category?: number[];
    instructor?: number[];
    sort?: string;
}

const API_BASE_URL = 'https://test4.questx.com.vn/wp-json';

/**
 * Fetch post_type=lp_course from WordPress REST API (/wp/v2/lp_course?_embed=true)
 */
export async function fetchWPCourses(params: FetchCoursesParams = {}): Promise<WPLPCoursesResponse | null> {
    const page = params.page || 1;
    const perPage = params.perPage || 9;

    let url = `${API_BASE_URL}/wp/v2/lp_course?_embed=true&page=${page}&per_page=${perPage}`;

    if (params.category && params.category.length > 0) {
        url += `&course_category=${params.category.join(',')}`;
    }
    if (params.instructor && params.instructor.length > 0) {
        url += `&author=${params.instructor.join(',')}`;
    }
    if (params.sort === 'az') {
        url += `&orderby=title&order=asc`;
    } else if (params.sort === 'za') {
        url += `&orderby=title&order=desc`;
    } else if (params.sort === 'oldest') {
        url += `&orderby=date&order=asc`;
    } else if (params.sort === 'newest') {
        url += `&orderby=date&order=desc`;
    }

    try {
        const response = await fetch(url, {
            next: { revalidate: 60 },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
        const courses: WPLPCourseItem[] = await response.json();

        return {
            courses,
            total: total || courses.length,
            totalPages: totalPages || 1,
        };
    } catch (error) {
        console.error('Failed to fetch lp_course from WP REST API:', error);
        return null;
    }
}

/**
 * Fetch all courses to calculate exact Level counts (_lp_level)
 */
export async function fetchWPLevelCounts(): Promise<Record<string, number> | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/wp/v2/lp_course?per_page=100`, {
            next: { revalidate: 300 },
        });

        if (!response.ok) return null;

        const courses: WPLPCourseItem[] = await response.json();
        const counts: Record<string, number> = {
            'All Levels': 0,
            'Beginner': 0,
            'Intermediate': 0,
            'Expert': 0,
        };

        courses.forEach((item: any) => {
            const rawLevel = String(item._lp_level || item.meta?._lp_level || 'beginner').toLowerCase().trim();
            if (rawLevel.includes('intermediate')) {
                counts['Intermediate']++;
            } else if (rawLevel.includes('expert')) {
                counts['Expert']++;
            } else if (rawLevel.includes('all')) {
                counts['All Levels']++;
            } else {
                counts['Beginner']++;
            }
        });

        return counts;
    } catch (error) {
        console.error('Failed to fetch level counts:', error);
        return null;
    }
}

/**
 * Fetch Price counts (All, Free, Paid) across all courses
 */
export async function fetchWPPriceCounts(): Promise<{ all: number; free: number; paid: number } | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/wp/v2/lp_course?per_page=100`, {
            next: { revalidate: 300 },
        });

        if (!response.ok) return null;

        const courses: WPLPCourseItem[] = await response.json();
        let freeCount = 0;
        let paidCount = 0;

        courses.forEach((item: any) => {
            const priceVal = (item as any)._lp_price || (item as any)._lp_regular_price || item.meta?._lp_price || item.meta?._lp_regular_price;
            const numPrice = Number(priceVal);
            if (!priceVal || priceVal === '0' || priceVal === 0 || isNaN(numPrice) || numPrice === 0) {
                freeCount++;
            } else {
                paidCount++;
            }
        });

        return {
            all: courses.length,
            free: freeCount,
            paid: paidCount,
        };
    } catch (error) {
        console.error('Failed to fetch price counts:', error);
        return null;
    }
}

/**
 * Fetch instructors (authors with published lp_course) and their course counts
 */
export async function fetchWPInstructors(): Promise<Array<{ id: number; name: string; count: number }> | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/wp/v2/lp_course?_embed=true&per_page=100`, {
            next: { revalidate: 300 },
        });

        if (!response.ok) return [];

        const courses: WPLPCourseItem[] = await response.json();
        const instructorMap: Record<string, { id: number; name: string; count: number }> = {};

        courses.forEach((item: WPLPCourseItem) => {
            const authorObj = item._embedded?.['author']?.[0];
            if (authorObj && authorObj.name) {
                const name = authorObj.name;
                if (!instructorMap[name]) {
                    instructorMap[name] = { id: authorObj.id, name, count: 0 };
                }
                instructorMap[name].count++;
            }
        });

        return Object.values(instructorMap);
    } catch (error) {
        console.error('Failed to fetch instructors:', error);
        return [];
    }
}

/**
 * Fetch course categories from WordPress REST API
 */
export async function fetchLPCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/wp/v2/course_category?per_page=100`, {
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch course categories:', error);
        return [];
    }
}

/**
 * Fetch a single course by slug from WordPress REST API
 */
export async function fetchWPCourseBySlug(slug: string): Promise<WPLPCourseItem | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/wp/v2/lp_course?slug=${encodeURIComponent(slug)}&_embed=true`, {
            next: { revalidate: 300 },
        });

        if (!response.ok) return null;

        const courses: WPLPCourseItem[] = await response.json();
        if (courses.length === 0) return null;

        const course = courses[0];
        if (course.sections && Array.isArray(course.sections)) {
            const quizIds: string[] = [];
            course.sections.forEach((sec: any) => {
                if (sec.items && Array.isArray(sec.items)) {
                    sec.items.forEach((item: any) => {
                        const isQuiz = item.item_type === 'lp_quiz' || item.type === 'lp_quiz' || (item.title && (item.title.toLowerCase().includes('quiz') || item.title.toLowerCase().includes('review')));
                        if (isQuiz && (item.item_id || item.id)) {
                            quizIds.push(String(item.item_id || item.id));
                        }
                    });
                }
            });

            if (quizIds.length > 0) {
                try {
                    const quizRes = await fetch(`${API_BASE_URL}/wp/v2/lp_quiz?include=${quizIds.join(',')}`, {
                        next: { revalidate: 300 },
                    });
                    if (quizRes.ok) {
                        const quizzes = await quizRes.json();
                        const quizMap = new Map<string, any>();
                        quizzes.forEach((q: any) => {
                            quizMap.set(String(q.id), q);
                        });
                        course.sections.forEach((sec: any) => {
                            if (sec.items && Array.isArray(sec.items)) {
                                sec.items.forEach((item: any) => {
                                    const qId = String(item.item_id || item.id);
                                    if (quizMap.has(qId)) {
                                        const qObj = quizMap.get(qId);
                                        item.questions_count = qObj.questions_count || (qObj.questions ? `${qObj.questions.length} questions` : undefined);
                                    }
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.error('Failed to fetch quiz details for course sections:', e);
                }
            }
        }

        return course;
    } catch (error) {
        console.error('Failed to fetch course by slug:', error);
        return null;
    }
}
