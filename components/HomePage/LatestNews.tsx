import Image from 'next/image';
import Link from 'next/link';
import LazyLoad from '../common/LazyLoad';
import styles from './LatestNews.module.css';
import { getPosts } from '../../lib/wordpress';

export default async function LatestNews() {
  const posts = await getPosts(3);

  const newsArticles = posts.map((post: any) => {
    // Extract categories
    let categories: { name: string; slug: string }[] = [];
    if (post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][0]) {
      categories = post._embedded['wp:term'][0].map((cat: any) => ({
        name: cat.name,
        slug: cat.slug
      })).filter((cat: any) => cat.name);
    }
    if (categories.length === 0) {
      categories = [{ name: 'News', slug: '' }];
    }

    // Extract image
    let imageUrl = '/images/course-01.jpg'; // fallback image
    if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
      imageUrl = post._embedded['wp:featuredmedia'][0].source_url || imageUrl;
    }

    // Strip HTML from excerpt
    let excerpt = post.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim() || '';
    if (excerpt.length > 80) excerpt = excerpt.substring(0, 80) + '...';

    // Format date
    const dateObj = new Date(post.date);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    const dateFormatted = `${day} ${month}, ${year}`;

    // Extract comments count
    const commentCount = post.comment_count ?? post._embedded?.replies?.[0]?.length ?? 0;
    const commentsFormatted = `${commentCount} ${commentCount === 1 ? 'Comment' : 'Comments'}`;

    // Decode title slightly
    let title = post.title?.rendered || '';
    title = title.replace(/&#(\d+);/g, (match: string, dec: number) => String.fromCharCode(dec))
                 .replace(/&#x([0-9a-f]+);/ig, (match: string, hex: string) => String.fromCharCode(parseInt(hex, 16)))
                 .replace(/&amp;/g, '&')
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>')
                 .replace(/&quot;/g, '"')
                 .replace(/&#039;/g, "'");

    return {
      id: post.id,
      title: title,
      categories: categories,
      date: dateFormatted,
      comments: commentsFormatted,
      excerpt: excerpt,
      image: imageUrl,
      url: `/${post.slug}`,
    };
  });

  return (
    <section className={styles.hn_latest_news}>
      <div className={styles.hn_latest_news__background_overlay}>
        <Image src="/images/banner_background_top.svg" alt="" width={1920} height={1080} className={styles.hn_latest_news__background_overlay} />
      </div>
      <div className={styles.hn_latest_news__container}>
        <div className={styles.hn_latest_news__column}>
          <div className={styles.hn_latest_news__widget_wrap}>

            {/* Shape Image Widget: fadeIn, delay 500 */}
            <LazyLoad animation="fade-in" animationDelay={500} className={styles.hn_latest_news__shape_widget}>
              <div className={styles.hn_latest_news__widget_container}>
                <Image
                  src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-25-1.png"
                  alt="shape-25"
                  width={186}
                  height={186}
                  className={styles.hn_latest_news__shape_image}
                />
              </div>
            </LazyLoad>

            {/* Section Heading Widget: edublink--slide-up, delay 100 */}
            <LazyLoad animation="slide-up" animationDelay={100} className={styles.hn_latest_news__heading_widget}>
              <div className={styles.hn_latest_news__widget_container}>
                <div className={styles.hn_latest_news__section_heading}>
                  <span className={styles.hn_latest_news__pre_heading}>LATEST ARTICLES</span>
                  <h3 className={styles.hn_latest_news__heading}>Get News with EduBlink</h3>
                  <div className={styles.hn_latest_news__title_shape}>
                    <i className="icon-19"></i>
                  </div>
                </div>
              </div>
            </LazyLoad>

            {/* Post Grid Widget: edublink--slide-up, delay 200 */}
            <LazyLoad animation="slide-up" animationDelay={200} className={styles.hn_latest_news__post_widget}>
              <div className={styles.hn_latest_news__widget_container}>
                <div className={styles.hn_latest_news__post_wrapper_outer}>
                  <div className={styles.hn_latest_news__blog_post_wrapper}>

                    {newsArticles.map((article: any) => (
                      <div key={article.id} className={styles.hn_latest_news__single_grid}>
                        <div className={styles.hn_latest_news__edu_blog}>
                          <div className={styles.hn_latest_news__inner}>

                            {/* Thumbnail */}
                            <div className={styles.hn_latest_news__thumbnail}>
                              <Link href={article.url}>
                                <Image
                                  src={article.image}
                                  alt={article.title}
                                  width={400}
                                  height={400}
                                  className={styles.hn_latest_news__thumb_image}
                                />
                              </Link>
                            </div>

                            {/* Content Box */}
                            <div className={styles.hn_latest_news__content}>

                              {/* Round Read More Button */}
                              <div className={styles.hn_latest_news__read_more_btn}>
                                <Link href={article.url} className={styles.hn_latest_news__btn_icon_round}>
                                  <i className="icon-4"></i>
                                </Link>
                              </div>

                              {/* Category */}
                              <div className={styles.hn_latest_news__category_wrap}>
                                {article.categories.map((cat: any, idx: number) => (
                                  <span key={cat.slug || idx}>
                                    <Link 
                                      href={cat.slug ? `/category/${cat.slug}` : '#'} 
                                      className={styles.hn_latest_news__category_link}
                                    >
                                      {cat.name}
                                    </Link>
                                    {idx < article.categories.length - 1 && (
                                      <span className={styles.hn_latest_news__category_separator}>, </span>
                                    )}
                                  </span>
                                ))}
                              </div>

                              {/* Title */}
                              <h5 className={styles.hn_latest_news__title}>
                                <Link href={article.url} className={styles.hn_latest_news__title_link}>
                                  {article.title}
                                </Link>
                              </h5>

                              {/* Meta Info */}
                              <ul className={styles.hn_latest_news__blog_meta}>
                                <li className={styles.hn_latest_news__meta_item}>
                                  <i className="icon-27"></i>
                                  {article.date}
                                </li>
                                <li className={styles.hn_latest_news__meta_item}>
                                  <i className="icon-28"></i>
                                  {article.comments}
                                </li>
                              </ul>

                              {/* Excerpt */}
                              <p className={styles.hn_latest_news__excerpt}>{article.excerpt}</p>

                            </div>

                          </div>
                        </div>
                      </div>
                    ))}

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
