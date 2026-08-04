import HeadingSectionText from "@/components/common/HeadingSectionText";
import styles from "@/styles/SinglePostPage.module.css";
import WidgetPost from "@/components/common/WidgetPost";
import Link from 'next/link';
import { MoveLeft, MoveRight } from "lucide-react";
import { notFound } from 'next/navigation';

interface SinglePostPageProps {
    params: Promise<{ slug: string }>;
}

// 1. Fetch single post details by slug
async function getPostBySlug(slug: string) {
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;

    try {
        const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?slug=${slug}&_embed`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return null;

        const posts = await res.json();
        return posts.length > 0 ? posts[0] : null;
    } catch (error) {
        console.error("Error fetching single post:", error);
        return null;
    }
}

// 2. Fetch post comments by postId & get total count (including replies)
async function getPostComments(postId: number) {
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;

    try {
        const res = await fetch(`${wpUrl}/wp-json/wp/v2/comments?post=${postId}&per_page=100&_embed`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return { rootComments: [], totalCommentsCount: 0 };

        const comments = await res.json();

        // Get total comment count from WordPress API Header 'X-WP-Total'
        const headerTotal = res.headers.get('X-WP-Total');
        const totalCommentsCount = headerTotal ? parseInt(headerTotal, 10) : comments.length;

        // Organize comments in a Tree structure (Parent - Child / Replies)
        const commentMap: { [key: number]: any } = {};
        const rootComments: any[] = [];

        comments.forEach((comment: any) => {
            comment.children = [];
            commentMap[comment.id] = comment;
        });

        comments.forEach((comment: any) => {
            if (comment.parent && commentMap[comment.parent]) {
                commentMap[comment.parent].children.push(comment);
            } else {
                rootComments.push(comment);
            }
        });

        return { rootComments, totalCommentsCount };
    } catch (error) {
        console.error("Error fetching comments:", error);
        return { rootComments: [], totalCommentsCount: 0 };
    }
}

// 3. Fetch previous and next adjacent posts
async function getAdjacentPosts(currentPostDate: string) {
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;

    try {
        const [prevRes, nextRes] = await Promise.all([
            fetch(`${wpUrl}/wp-json/wp/v2/posts?before=${currentPostDate}&per_page=1&order=desc`, { next: { revalidate: 60 } }),
            fetch(`${wpUrl}/wp-json/wp/v2/posts?after=${currentPostDate}&per_page=1&order=asc`, { next: { revalidate: 60 } })
        ]);

        const prevData = prevRes.ok ? await prevRes.json() : [];
        const nextData = nextRes.ok ? await nextRes.json() : [];

        return {
            prevPost: prevData.length > 0 ? prevData[0] : null,
            nextPost: nextData.length > 0 ? nextData[0] : null
        };
    } catch (error) {
        console.error("Error fetching adjacent posts:", error);
        return { prevPost: null, nextPost: null };
    }
}

// 4. Fetch Sidebar Widgets (Posts, Categories, Tags)
async function getSidebarData() {
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;
    try {
        const [recentRes, catRes, tagRes] = await Promise.all([
            fetch(`${wpUrl}/wp-json/wp/v2/posts?_embed&per_page=3`, { next: { revalidate: 60 } }),
            fetch(`${wpUrl}/wp-json/wp/v2/categories?hide_empty=true&per_page=100`, { next: { revalidate: 60 } }),
            fetch(`${wpUrl}/wp-json/wp/v2/tags?hide_empty=true&per_page=100`, { next: { revalidate: 60 } })
        ]);

        return {
            recentPosts: recentRes.ok ? await recentRes.json() : [],
            categories: catRes.ok ? await catRes.json() : [],
            tags: tagRes.ok ? await tagRes.json() : []
        };
    } catch (error) {
        console.error("Error fetching sidebar data:", error);
        return { recentPosts: [], categories: [], tags: [] };
    }
}

// Recursive helper to count total comments + replies (Fallback when API doesn't return Header)
function countTotalComments(commentList: any[]): number {
    return commentList.reduce((total, comment) => {
        const childrenCount = comment.children ? countTotalComments(comment.children) : 0;
        return total + 1 + childrenCount;
    }, 0);
}

// Helper Date Formatting
function formatDate(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatCommentDate(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Recursive component to render each comment (including child/reply comments)
function CommentItem({ comment }: { comment: any }) {
    const avatar = comment.author_avatar_urls?.['96'] || "https://demo.edublink.co/wp-content/uploads/2023/06/team-02-100x100.webp";
    const authorName = comment.author_name || "Anonymous";

    return (
        <li className={styles.hn__singlePostPage_commentItem}>
            <article className={styles.hn__singlePostPage_commentCard}>
                <figure className={styles.hn__singlePostPage_commentAvatar}>
                    {comment.author_url ? (
                        <a href={comment.author_url} target="_blank" rel="noopener noreferrer">
                            <img width="100" height="100" src={avatar} alt={authorName} loading="lazy" />
                        </a>
                    ) : (
                        <img width="100" height="100" src={avatar} alt={authorName} loading="lazy" />
                    )}
                </figure>
                <div className={styles.hn__singlePostPage_commentBody}>
                    <header className={styles.hn__singlePostPage_commentHeader}>
                        <h3 className={styles.hn__singlePostPage_commentAuthor}>
                            {comment.author_url ? (
                                <a href={comment.author_url} target="_blank" rel="noopener noreferrer">
                                    {authorName}
                                </a>
                            ) : (
                                authorName
                            )}
                        </h3>
                        <time className={styles.hn__singlePostPage_commentTime} dateTime={comment.date}>
                            {formatCommentDate(comment.date)}
                        </time>
                    </header>
                    <div
                        className={styles.hn__singlePostPage_commentText}
                        dangerouslySetInnerHTML={{ __html: comment.content?.rendered }}
                    />
                    <div className={styles.hn__singlePostPage_commentReply}>
                        <a href={`#respond?replytocom=${comment.id}`} aria-label={`Reply to ${authorName}`}>
                            <i className="ri-reply-all-line" aria-hidden="true"></i> Reply
                        </a>
                    </div>
                </div>
            </article>

            {/* Display child/reply comments list (if any) */}
            {comment.children && comment.children.length > 0 && (
                <ol className={styles.hn__singlePostPage_commentChildren}>
                    {comment.children.map((childComment: any) => (
                        <CommentItem key={childComment.id} comment={childComment} />
                    ))}
                </ol>
            )}
        </li>
    );
}

export default async function SinglePostPage({ params }: SinglePostPageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    // If post is not found on WordPress REST API => Trigger 404 Not Found
    if (!post) {
        notFound();
    }

    // Fetch comment data along with related information
    const [{ rootComments, totalCommentsCount }, { prevPost, nextPost }, { recentPosts, categories, tags }] = await Promise.all([
        getPostComments(post.id),
        getAdjacentPosts(post.date),
        getSidebarData()
    ]);

    // Post & Author metadata
    const category = post._embedded?.['wp:term']?.[0]?.[0];
    const postTags = post._embedded?.['wp:term']?.[1] || [];
    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/placeholder.jpg';

    const author = post._embedded?.author?.[0];
    const authorName = author?.name || "Edward Norton";
    const authorAvatar = author?.avatar_urls?.['96'] || "https://demo.edublink.co/wp-content/uploads/2023/06/team-02.webp";
    const authorDescription = author?.description || "Consectetur adipisicing elit, sed do eiusmod tempor incididunt labore et dolore magna aliqua enim minim veniam quis nostrud exercitation ulla mco laboris nisi ut aliquip ex ea commodo consequat.";
    const authorLink = author?.slug ? `/author/${author.slug}` : "#";

    // Accurately calculate total comments including replies
    const finalCommentCount = post.comment_count ?? (totalCommentsCount > 0 ? totalCommentsCount : countTotalComments(rootComments));
    const commentText = `${finalCommentCount} ${finalCommentCount === 1 ? 'Comment' : 'Comments'}`;

    const postTitle = post.title?.rendered
        ? post.title.rendered.replace(/&#(\d+);/g, (_: string, dec: number) => String.fromCharCode(dec))
        : "Single Post";

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        ...(category ? [{ label: category.name, href: `/category/${category.slug}` }] : []),
        { label: postTitle }
    ];

    return (
        <main>
            <HeadingSectionText
                title={postTitle}
                breadcrumb={breadcrumbItems}
            />
            <div className={styles.hn__singlePostPage}>
                <div className={styles.hn__singlePostPage_container}>
                    <div className={styles.hn__singlePostPage_row}>

                        {/* MAIN CONTENT COLUMN */}
                        <div className={styles.hn__singlePostPage_primary}>

                            {/* ARTICLE ITEM */}
                            <article className={styles.hn__singlePostPage_article}>

                                {/* ARTICLE HEADER */}
                                <header className={styles.hn__singlePostPage_header}>
                                    {category && (
                                        <div className={styles.hn__singlePostPage_category}>
                                            <Link href={`/category/${category.slug}`}>
                                                {category.name}
                                            </Link>
                                        </div>
                                    )}
                                    <h1
                                        className={styles.hn__singlePostPage_title}
                                        dangerouslySetInnerHTML={{ __html: post.title?.rendered }}
                                    />
                                    <ul className={styles.hn__singlePostPage_meta}>
                                        <li className={styles.hn__singlePostPage_metaItem}>
                                            <time dateTime={post.date}>
                                                <i className="icon-27" aria-hidden="true"></i> {formatDate(post.date)}
                                            </time>
                                        </li>
                                        <li className={styles.hn__singlePostPage_metaItem}>
                                            <i className="icon-28" aria-hidden="true"></i> {commentText}
                                        </li>
                                    </ul>
                                </header>

                                {/* FEATURED IMAGE */}
                                <figure className={styles.hn__singlePostPage_featuredImage}>
                                    <img
                                        width="1200"
                                        height="800"
                                        src={featuredImage}
                                        alt={postTitle}
                                        loading="lazy"
                                    />
                                </figure>

                                {/* ORIGINAL WORDPRESS CONTENT */}
                                <div
                                    className={styles.hn__singlePostPage_content}
                                    dangerouslySetInnerHTML={{ __html: post.content?.rendered }}
                                />

                                {/* ARTICLE FOOTER */}
                                <footer className={styles.hn__singlePostPage_articleFooter}>
                                    <div className={styles.hn__singlePostPage_shareWrapper}>
                                        <div className={styles.hn__singlePostPage_tagsBox}>
                                            <span className={styles.hn__singlePostPage_tagTitle}>Tags: </span>
                                            <div className={styles.hn__singlePostPage_tagList}>
                                                {postTags.length > 0 ? (
                                                    postTags.map((tag: any) => (
                                                        <Link key={tag.id} href={`/tag/${tag.slug}`}>
                                                            {tag.name}
                                                        </Link>
                                                    ))
                                                ) : (
                                                    <span>No tags</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.hn__singlePostPage_socialShare}>
                                            <span className={styles.hn__singlePostPage_shareTitle}>Share on: </span>
                                            <ul className={styles.hn__singlePostPage_socialList}>
                                                <li>
                                                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent((process.env.NEXT_PUBLIC_WORDPRESS_URL || '') + '/' + post.slug)}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                                        <i className="icon-facebook"></i>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent((process.env.NEXT_PUBLIC_WORDPRESS_URL || '') + '/' + post.slug)}`} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                                        <i className="icon-twitter"></i>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent((process.env.NEXT_PUBLIC_WORDPRESS_URL || '') + '/' + post.slug)}`} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                                        <i className="icon-linkedin2"></i>
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </footer>
                            </article>

                            {/* AUTHOR BIO */}
                            <section className={styles.hn__singlePostPage_authorBio}>
                                <figure className={styles.hn__singlePostPage_authorThumb}>
                                    <Link href={authorLink}>
                                        <img width="169" height="200" src={authorAvatar} alt={authorName} loading="lazy" />
                                    </Link>
                                </figure>
                                <div className={styles.hn__singlePostPage_authorDetails}>
                                    <h2 className={styles.hn__singlePostPage_authorName}>
                                        <Link href={authorLink}>{authorName}</Link>
                                    </h2>
                                    <div className={styles.hn__singlePostPage_authorInfo}>
                                        <p>{authorDescription}</p>
                                    </div>
                                    <div className={styles.hn__singlePostPage_authorSocials}>
                                        <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="icon-facebook" aria-hidden="true"></i></a>
                                        <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><i className="icon-twitter" aria-hidden="true"></i></a>
                                        <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i className="icon-linkedin2" aria-hidden="true"></i></a>
                                    </div>
                                </div>
                            </section>

                            {/* PREV / NEXT POST NAVIGATION */}
                            <nav className={styles.hn__singlePostPage_postNav} aria-label="Post navigation">
                                <div className={styles.hn__singlePostPage_postNavItem}>
                                    {prevPost && (
                                        <div className={`${styles.hn__singlePostPage_singleNav} ${styles['hn__singlePostPage_singleNav--prev']}`}>
                                            <Link href={`/${prevPost.slug}`}>
                                                <MoveLeft aria-hidden="true" />
                                                <span className={styles.hn__singlePostPage_navTitle} dangerouslySetInnerHTML={{ __html: prevPost.title?.rendered }} />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.hn__singlePostPage_postNavItem}>
                                    {nextPost && (
                                        <div className={`${styles.hn__singlePostPage_singleNav} ${styles['hn__singlePostPage_singleNav--next']}`}>
                                            <Link href={`/${nextPost.slug}`}>
                                                <span className={styles.hn__singlePostPage_navTitle} dangerouslySetInnerHTML={{ __html: nextPost.title?.rendered }} />
                                                <MoveRight aria-hidden="true" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </nav>

                            {/* COMMENTS AREA */}
                            <section className={styles.hn__singlePostPage_commentsSection}>
                                <h2 className={styles.hn__singlePostPage_commentsTitle}>{commentText}</h2>

                                {/* COMMENTS LIST FROM DYNAMIC WORDPRESS DATA */}
                                {rootComments.length > 0 ? (
                                    <ol className={styles.hn__singlePostPage_commentList}>
                                        {rootComments.map((comment: any) => (
                                            <CommentItem key={comment.id} comment={comment} />
                                        ))}
                                    </ol>
                                ) : (
                                    <p style={{ margin: '20px 0', color: '#666' }}>No comments yet. Be the first to leave a comment!</p>
                                )}

                                {/* COMMENT FORM */}
                                <div id="respond" className={styles.hn__singlePostPage_respondForm}>
                                    <h3 className={styles.hn__singlePostPage_respondTitle}>Leave a Reply</h3>
                                    <form className={styles.hn__singlePostPage_form}>
                                        <div className={styles.hn__singlePostPage_formGroup}>
                                            <label htmlFor="comment" className={styles.hn__singlePostPage_srOnly}>Comment</label>
                                            <textarea
                                                id="comment"
                                                name="comment"
                                                rows={6}
                                                className={styles.hn__singlePostPage_textarea}
                                                placeholder="Comment *"
                                                required
                                            ></textarea>
                                        </div>
                                        <div className={styles.hn__singlePostPage_formSubmit}>
                                            <button type="submit" className={styles.hn__singlePostPage_submitBtn}>
                                                Post A Comment
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </section>

                        </div>

                        {/* SIDEBAR COLUMN */}
                        <aside className={styles.hn__singlePostPage_sidebar}>
                            <WidgetPost
                                posts={recentPosts}
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