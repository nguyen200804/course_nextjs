import Link from 'next/link';
import Image from 'next/image';
import styles from './Home.module.css';

export default function HomeMegaMenu() {
  return (
    <div className={styles.megaMenuContainer}>
      <div className={styles.column}>
        <ul className={`${styles.menuList} ${styles.lineRight}`}>
          <li><Link href="/category">EduBlink Education</Link><span className={`${styles.badge} ${styles.hot}`}>HOT</span></li>
          <li><Link href="/category">Distant Learning</Link></li>
          <li><Link href="/category">University</Link></li>
          <li><Link href="/category">Online Academy</Link><span className={`${styles.badge} ${styles.hot}`}>HOT</span></li>
          <li><Link href="/category">Modern Schooling</Link></li>
          <li><Link href="/category">Kitchen Coach</Link></li>
          <li><Link href="/category">Yoga Instructor</Link></li>
          <li><Link href="/category">Kindergarten</Link></li>
          <li><Link href="/category">Language Academy</Link></li>
          <li><Link href="/category">Remote Training</Link></li>
        </ul>
      </div>

      <div className={styles.column}>
        <ul className={`${styles.menuList} ${styles.alignCenter}`}>

          <li><Link href="/category">Business Coach</Link></li>
          <li><Link href="/category">Motivation</Link></li>
          <li><Link href="/category">Programming</Link></li>
          <li><Link href="/category">Online Art</Link></li>
          <li><Link href="/category">Sales Coach</Link><span className={`${styles.badge} ${styles.new}`}>NEW</span></li>
          <li><Link href="/category">Quran Learning</Link><span className={`${styles.badge} ${styles.new}`}>NEW</span></li>
          <li><Link href="/category">Gym Training</Link><span className={`${styles.badge} ${styles.new}`}>NEW</span></li>
          <li><Link href="/category">Photography</Link><span className={`${styles.badge} ${styles.new}`}>NEW</span></li>
          <li><Link href="/category">Health Coach</Link><span className={`${styles.badge} ${styles.new}`}>NEW</span><span className={`${styles.badge} ${styles.hot}`}>HOT</span></li>
          <li><Link href="/category">Digital Marketing</Link><span className={`${styles.badge} ${styles.new}`}>NEW</span><span className={`${styles.badge} ${styles.hot}`}>HOT</span></li>
        </ul>
      </div>

      <div className={styles.promoColumn}>
        <div className={styles.promoCard}>
          <Image
            src="/images/mega-menu-image.webp"
            alt="Promo"
            width={534}
            height={315}
          />
        </div>
      </div>
    </div>
  );
}
