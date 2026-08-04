import Link from "next/link";
import styles from "./WidgetPost.module.css";

interface WidgetPostProps {
    posts: any[];
    categories: any[];
    tags: any[];
    formatDate: (dateString: string) => string;
}

export default function WidgetPost({ posts, categories, tags, formatDate }: WidgetPostProps) {
    return (
        <div className={styles.hn__blogPage_sidebarWrap}>
            {/* Widget: Tìm kiếm */}
            <section className={`${styles.hn__blogPage_widget} ${styles.hn__blogPage_widgetSearch}`}>
                <h2 className={styles.hn__blogPage_widgetTitle}>Search</h2>
                <form className={styles.hn__blogPage_searchForm} action="/search" method="get" role="search">
                    <input type="search" id="hn__blogPage_searchInput" className={styles.hn__blogPage_searchInput} name="s" placeholder="Search" required />
                    <button type="submit" className={styles.hn__blogPage_searchBtn} aria-label="Search">
                        <i className="icon-2" aria-hidden="true"></i>
                    </button>
                </form>
            </section>

            {/* Widget: Bài viết mới nhất (3 bài) */}
            <section className={`${styles.hn__blogPage_widget} ${styles.hn__blogPage_widgetRecentPosts}`}>
                <h2 className={styles.hn__blogPage_widgetTitle}>Latest Post</h2>
                <div className={styles.hn__blogPage_recentList}>
                    {posts.slice(0, 3).map((recentPost: any) => {
                        const recentImage = recentPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/placeholder.jpg';
                        return (
                            <article key={recentPost.id} className={styles.hn__blogPage_recentItem}>
                                <figure className={styles.hn__blogPage_recentThumb}>
                                    <Link href={`/${recentPost.slug}`}>
                                        <img src={recentImage} alt={recentPost.title?.rendered} loading="lazy" />
                                    </Link>
                                </figure>
                                <div className={styles.hn__blogPage_recentBody}>
                                    <h3 className={styles.hn__blogPage_recentTitle}>
                                        <Link
                                            href={`/${recentPost.slug}`}
                                            dangerouslySetInnerHTML={{ __html: recentPost.title?.rendered }}
                                        />
                                    </h3>
                                    <time className={styles.hn__blogPage_recentDate} dateTime={recentPost.date}>
                                        <i className="icon-27" aria-hidden="true"></i> {formatDate(recentPost.date)}
                                    </time>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* Section list category */}
            <section className={`${styles.hn__blogPage_widget} ${styles.hn__blogPage_widgetCategories}`}>
                <h2 className={styles.hn__blogPage_widgetTitle}>Categories</h2>
                <ul className={styles.hn__blogPage_categoryList}>
                    {categories.length > 0 ? (
                        categories.map((cat: any) => (
                            <li key={cat.id} className={styles.hn__blogPage_categoryItem}>
                                <Link href={`/category/${cat.slug}`}>
                                    {cat.name}
                                </Link>{' '}
                                <span className={styles.hn__blogPage_categoryCount}>
                                    ({cat.count})
                                </span>
                            </li>
                        ))
                    ) : (
                        <li>Chưa có danh mục</li>
                    )}
                </ul>
            </section>

            {/* Widget: Banner Quảng cáo */}
            <section className={`${styles.hn__blogPage_widget} ${styles.hn__blogPage_widgetBanner}`}>
                <figure className={styles.hn__blogPage_bannerThumb}>
                    <img src="https://demo.edublink.co/wp-content/uploads/2023/11/sidebar-ad.png" alt="Sidebar Banner" width="290" height="370" loading="lazy" />
                </figure>
            </section>

            {/* Section list tag */}
            <section className={`${styles.hn__blogPage_widget} ${styles.hn__blogPage_widgetTags}`}>
                <h2 className={styles.hn__blogPage_widgetTitle}>Tags</h2>
                <div className={styles.hn__blogPage_tagCloud}>
                    {tags.length > 0 ? (
                        tags.map((tag: any) => (
                            <Link
                                key={tag.id}
                                href={`/tag/${tag.slug}`}
                                className={styles.hn__blogPage_tagLink}
                                aria-label={`${tag.name} (${tag.count} items)`}
                            >
                                {tag.name}
                            </Link>
                        ))
                    ) : (
                        <span>Chưa có thẻ</span>
                    )}
                </div>
            </section>
        </div>
    );
}