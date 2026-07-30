import Link from 'next/link';
import Image from 'next/image';
import LazyLoad from '../common/LazyLoad';
import styles from './CourseCategories.module.css';

const categories = [
    {
        id: 'business',
        iconClass: 'icon-9',
        title: 'Online Degree Programs',
        description: 'Lorem ipsum dolor consec tur elit adicing sed umod tempor.',
        coursesCount: '15 Courses',
        link: '/course-category/business',
        themeClass: styles.cardTeal,
    },
    {
        id: 'cooking',
        iconClass: 'icon-10',
        title: 'Non-Degree Programs',
        description: 'Lorem ipsum dolor consec tur elit adicing sed umod tempor.',
        coursesCount: '8 Courses',
        link: '/course-category/cooking',
        themeClass: styles.cardRed,
    },
    {
        id: 'digital-marketing',
        iconClass: 'icon-11',
        title: 'Off-Campus Programs',
        description: 'Lorem ipsum dolor consec tur elit adicing sed umod tempor.',
        coursesCount: '9 Courses',
        link: '/course-category/digital-marketing',
        themeClass: styles.cardBlue,
    },
    {
        id: 'programming',
        iconClass: 'icon-12',
        title: 'Hybrid Distance Programs',
        description: 'Lorem ipsum dolor consec tur elit adicing sed umod tempor.',
        coursesCount: '8 Courses',
        link: '/course-category/programming',
        themeClass: styles.cardYellow,
    },
];

export default function CourseCategories() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                
                {/* Header của Section: edublink--slide-up, delay 150 */}
                <LazyLoad animation="slide-up" animationDelay={150}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.preTitle}>CATEGORIES</span>
                        <h2 className={styles.heading}>
                            Online <span className={styles.highlightText}>Classes</span> For Remote Learning.
                        </h2>
                        <div className={styles.titleShape}>
                            <i className="icon-19"></i>
                        </div>
                        <p className={styles.subHeading}>
                            Consectetur adipiscing elit sed do eiusmod tempor.
                        </p>
                    </div>
                </LazyLoad>

                {/* Lưới 4 Thẻ danh mục (Category Grid): edublink--slide-up, delay 150 */}
                <LazyLoad animation="slide-up" animationDelay={150}>
                    <div className={styles.categoryGrid}>
                        {categories.map((cat) => (
                            <div key={cat.id} className={styles.categoryCardWrapper}>
                                <div className={`${styles.categoryCard} ${cat.themeClass}`}>
                                    <div className={styles.iconBox}>
                                        <i className={`${cat.iconClass} ${styles.iconFont}`}></i>
                                    </div>
                                    <div className={styles.cardContent}>
                                        <h3 className={styles.cardTitle}>
                                            <Link href={cat.link}>{cat.title}</Link>
                                        </h3>
                                        <p className={styles.cardDescription}>{cat.description}</p>
                                        <span className={styles.courseBadge}>{cat.coursesCount}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </LazyLoad>

            </div>
        </section>
    );
}
