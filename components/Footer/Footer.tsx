'use client';

import Image from 'next/image';
import Link from 'next/link';
import ButtonGreen from '@/components/common/ButtonGreen';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerBgImage}>
        <Image
          src="/images/background_footer.webp"
          alt="Footer Top"
          width={1920}
          height={474}
          className={styles.backgroundImage}
        />
        <div className={styles.container}>
          <div className={styles.mainGrid}>
            {/* Cột 1: Thông tin công ty / Thương hiệu */}
            <div className={styles.brandCol}>
              <div className={styles.logo}>
                <Image
                  src="/images/Site_logo.png"
                  alt="Logo"
                  width={158}
                  height={50}
                />
              </div>
              <p className={styles.description}>
                Lorem ipsum dolor amet consecto adi pisicing elit sed eiusm tempor incidid unt labore dolore.
              </p>
              <ul className={styles.contactList}>
                <li><span>Add:</span> 70-80 Upper St Norwich NR2</li>
                <li><span>Call:</span> <Link href="tel:+011235641231">+01 123 5641 231</Link></li>
                <li><span>Email:</span> <Link href="mailto:info@edublink.co">info@edublink.co</Link></li>
              </ul>
            </div>

            {/* Cột 2: Nền tảng Online */}
            <div className={`${styles.navCol} ${styles.navColOnlinePlatform}`}>
              <h4 className={styles.colTitle}>Online Platform</h4>
              <ul className={styles.navList}>
                <li><Link href="#">About</Link></li>
                <li><Link href="#">Course</Link></li>
                <li><Link href="#">Instructor</Link></li>
                <li><Link href="#">Events</Link></li>
                <li><Link href="#">Instructor Details</Link></li>
                <li><Link href="#">Purchase Guide</Link></li>
              </ul>
            </div>

            {/* Cột 3: Liên kết nhanh */}
            <div className={`${styles.navCol} ${styles.navColLinks}`}>
              <h4 className={styles.colTitle}>Links</h4>
              <ul className={styles.navList}>
                <li><Link href="#">Contact Us</Link></li>
                <li><Link href="#">Gallery</Link></li>
                <li><Link href="#">News & Articles</Link></li>
                <li><Link href="#">FAQ’s</Link></li>
                <li><Link href="#">Coming Soon</Link></li>
                <li><Link href="/my-account">Sign In/Registration</Link></li>
              </ul>
            </div>

            {/* Cột 4: Đăng ký tin tức & Mạng xã hội */}
            <div className={styles.newsletterCol}>
              <h4 className={styles.colTitle}>Contacts</h4>
              <p className={styles.newsletterNotice}>
                Enter your email address to register to our newsletter subscription
              </p>

              <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email"
                  className={styles.newsletterInput}
                  required
                />
                <ButtonGreen className={styles.newsletterBtn} />
              </form>

              <ul className={styles.socialList}>
                <li>
                  <Link href="#" aria-label="Facebook" className={styles.socialLinkFB}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link href="#" aria-label="LinkedIn" className={styles.socialLinkIN}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z" />
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link href="#" aria-label="Instagram" className={styles.socialLinkIG}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link href="#" aria-label="Twitter" className={styles.socialLinkTW}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z" />
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link href="#" aria-label="YouTube" className={styles.socialLinkYT}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh bản quyền ở chân trang */}
      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <p className={styles.copyrightText}>
            Copyright 2026  | All Rights Reserved. Design by <Link href="https://homenest.com.vn">HomeNest</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
