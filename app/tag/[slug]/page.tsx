import HeadingSectionText from "@/components/common/HeadingSectionText";
import styles from '@/styles/BlogPage.module.css';
import Link from 'next/link';
import WidgetPost from "@/components/common/WidgetPost";
import Pagination from "@/components/common/Pagination"; // Nhập component Pagination vừa tách
import { notFound } from "next/navigation";

interface TagPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

// 1. Fetch thông tin tag theo slug từ WordPress API
async function getTagBySlug(slug: string) {
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;

    try {
        const res = await fetch(`${wpUrl}/wp-json/wp/v2/tags?slug=${slug}`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return null;

        const tags = await res.json();
        return tags.length > 0 ? tags[0] : null;
    } catch (error) {
        console.error("Error fetching tag by slug:", error);
        return null;
    }
}

// 2. Fetch các bài viết thuộc tagId
async function getPostsByTag(tagId: number, page: number = 1, perPage: number = 10) {
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;

    try {
        const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?_embed&tags=${tagId}&per_page=${perPage}&page=${page}`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) {
            return { posts: [], totalPages: 1 };
        }

        const posts = await res.json();
        const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);

        return { posts, totalPages };
    } catch (error) {
        console.error("Error fetching tag posts:", error);
        return { posts: [], totalPages: 1 };
    }
}

// 3. Fetch danh sách Categories cho Sidebar Widget
async function getCategories() {
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;

    try {
        const res = await fetch(`${wpUrl}/wp-json/wp/v2/categories?hide_empty=true&per_page=100`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Error fetching WordPress categories:", error);
        return [];
    }
}

// 4. Fetch danh sách Tags cho Sidebar Widget
async function getTags() {
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;

    try {
        const res = await fetch(`${wpUrl}/wp-json/wp/v2/tags?hide_empty=true&per_page=100`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Error fetching WordPress tags:", error);
        return [];
    }
}

// Helper Format Ngày
function formatDate(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
    const { slug } = await params;
    const resolvedParams = await searchParams;
    const currentPage = parseInt(resolvedParams?.page || '1', 10);
    const perPage = 10;

    // Lấy thông tin tag dựa vào slug
    const tagInfo = await getTagBySlug(slug);

    // Nếu Tag không tồn tại => Trả về trang 404 Not Found
    if (!tagInfo) {
        notFound();
    }

    // Fetch đồng thời các bài viết theo Tag & dữ liệu Sidebar
    const [{ posts, totalPages }, categories, tags] = await Promise.all([
        getPostsByTag(tagInfo.id, currentPage, perPage),
        getCategories(),
        getTags()
    ]);

    // Format tên tag (Decode ký tự HTML mã hóa nếu có)
    const tagName = tagInfo.name.replace(/&#(\d+);/g, (_: string, dec: number) => String.fromCharCode(dec));

    return (
        <main>
            <HeadingSectionText
                title={`Tag: ${tagName}`}
                breadcrumb={[
                    { label: "Home", href: "/" },
                    { label: "Tag", href: "/blog" },
                    { label: tagName }
                ]}
            />
            <div className={styles.hn__blogPage}>
                <div className={styles.hn__blogPage_container}>
                    <div className={styles.hn__blogPage_row}>

                        {/* CỘT CHÍNH (MAIN CONTENT AREA) */}
                        <div className={styles.hn__blogPage_primary}>

                            {/* DANH SÁCH BÀI VIẾT THUỘC TAG */}
                            <div className={styles.hn__blogPage_postGrid}>
                                {posts.length > 0 ? (
                                    posts.map((post: any) => {
                                        const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
                                            || '/placeholder.jpg';
                                        const category = post._embedded?.['wp:term']?.[0]?.[0];

                                        return (
                                            <article key={post.id} className={styles.hn__blogPage_postCard}>
                                                <div className={styles.hn__blogPage_postInner}>
                                                    <figure className={styles.hn__blogPage_postThumbnail}>
                                                        <Link href={`/${post.slug}`}>
                                                            <img
                                                                src={featuredImage}
                                                                alt={post.title?.rendered || "Blog thumbnail"}
                                                                loading="lazy"
                                                            />
                                                        </Link>
                                                    </figure>
                                                    <div className={styles.hn__blogPage_postContent}>
                                                        {category && (
                                                            <div className={styles.hn__blogPage_postCategory}>
                                                                <Link href={`/category/${category.slug}`}>
                                                                    {category.name}
                                                                </Link>
                                                            </div>
                                                        )}
                                                        <h2 className={styles.hn__blogPage_postTitle}>
                                                            <Link
                                                                href={`/${post.slug}`}
                                                                dangerouslySetInnerHTML={{ __html: post.title?.rendered }}
                                                            />
                                                        </h2>
                                                        <ul className={styles.hn__blogPage_postMeta}>
                                                            <li className={styles.hn__blogPage_postMetaItem}>
                                                                <time dateTime={post.date}>
                                                                    <i className="icon-27" aria-hidden="true"></i> {formatDate(post.date)}
                                                                </time>
                                                            </li>
                                                            <li className={styles.hn__blogPage_postMetaItem}>
                                                                <i className="icon-28" aria-hidden="true"></i>{' '}
                                                                {(() => {
                                                                    const count = post.comment_count ?? post._embedded?.replies?.[0]?.length ?? 0;
                                                                    return `${count} ${count === 1 ? 'Comment' : 'Comments'}`;
                                                                })()}
                                                            </li>
                                                        </ul>
                                                        <div
                                                            className={styles.hn__blogPage_postExcerpt}
                                                            dangerouslySetInnerHTML={{ __html: post.excerpt?.rendered }}
                                                        />
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })
                                ) : (
                                    <p style={{ width: '100%', textAlign: 'center', padding: '40px 0' }}>
                                        No posts found tagged with "{tagName}".
                                    </p>
                                )}
                            </div>

                            {/* PHÂN TRANG (PAGINATION FOR TAG) */}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                baseUrl={`/tag/${slug}`}
                            />
                        </div>

                        {/* CỘT BÊN (SIDEBAR) */}
                        <aside className={styles.hn__blogPage_sidebar}>
                            <WidgetPost
                                posts={posts}
                                categories={categories}
                                tags={tags}
                                formatDate={formatDate}
                            />
                        </aside>

                    </div>
                </div>
            </div>
        </main>
    );
}