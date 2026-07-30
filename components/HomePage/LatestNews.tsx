import Image from 'next/image';
import Link from 'next/link';
import LazyLoad from '../common/LazyLoad';
import styles from './LatestNews.module.css';

const newsArticles = [
  {
    id: 1,
    title: 'Crafting Effective Learning Guide Line',
    category: 'Science',
    date: '15 Nov, 2023',
    comments: 'Com 0',
    excerpt: 'aConsectetur adipisicing elit, sed do eiusmod tempor inc...',
    image: 'https://demo.edublink.co/wp-content/uploads/2023/11/course-79-750x750.jpg',
    url: 'https://demo.edublink.co/crafting-effective-learning-paths-at-curriculum-corner/',
  },
  {
    id: 2,
    title: 'Exploring Learning Landscapes in Academic',
    category: 'Technology',
    date: '14 Nov, 2023',
    comments: 'Com 3',
    excerpt: 'Consectetur adipisicing elit, sed do eiusmod tempor inc idid unt ut labore et dolore magna aliqua enim ad...',
    image: 'https://demo.edublink.co/wp-content/uploads/2023/03/course-09-750x750.jpg',
    url: 'https://demo.edublink.co/exploring-learning-landscapes-in-academic-alcove/',
  },
  {
    id: 3,
    title: 'Voices from the Learning Education Hub',
    category: 'Learning',
    date: '13 Nov, 2023',
    comments: 'Com 0',
    excerpt: 'Consectetur adipisicing elit, sed do eiusmod tempor inc idid unt ut labore...',
    image: 'https://demo.edublink.co/wp-content/uploads/2023/03/course-07-750x750.jpg',
    url: 'https://demo.edublink.co/voices-from-the-learning-education-hub/',
  },
];

export default function LatestNews() {
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

                    {newsArticles.map((article) => (
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
                                <Link href="#" className={styles.hn_latest_news__category_link}>
                                  {article.category}
                                </Link>
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
