'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, ShoppingCart, X, Grip, ChevronDown } from 'lucide-react';
import ButtonGreen from '../common/ButtonGreen';
import HomeMegaMenu from '../MegaMenu/Home';
import { fetchLPCategories } from '@/lib/api/courses';
import styles from './Header.module.css';

export interface MenuItem {
  name: string;
  link: string;
  children?: MenuItem[];
  megaMenu?: React.ReactNode;
}

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  link: string;
}

const navItems: MenuItem[] = [
  {
    name: 'Home',
    link: '/',
    megaMenu: <HomeMegaMenu />,
  },
  {
    name: 'Pages',
    link: '#',
    children: [
      {
        name: 'About Us',
        link: '#',
        children: [
          { name: 'About Us 1', link: '/about-us-1' },
          { name: 'About Us 2', link: '/about-us-2' },
          { name: 'About Us 3', link: '/about-us-3' },
        ],
      },
      {
        name: 'Instructors',
        link: '#',
        children: [
          { name: 'Instructor 1', link: '/instructor-1' },
          { name: 'Instructor 2', link: '/instructor-2' },
          { name: 'Instructor 3', link: '/instructor-3' },
          { name: 'Instructor Details', link: '/instructor-details' },
        ],
      },
      {
        name: 'Event Pages',
        link: '#',
        children: [
          { name: 'Event Style 1', link: '/event-style-1' },
          { name: 'Event Details', link: '/event-details' },
        ],
      },
      {
        name: 'Shop Pages',
        link: '#',
        children: [
          { name: 'Product Details', link: '/product-details' },
        ],
      },
      { name: 'Zoom Meeting', link: '/zoom-meeting' },
      { name: "FAQ's", link: '/faq' },
      { name: 'Pricing Table', link: '/pricing-table' },
      { name: 'Privacy Policy', link: '/privacy-policy' },
      { name: 'Coming Soon', link: '/coming-soon' },
      { name: '404 Page', link: '/404' },
    ],
  },
  {
    name: 'Courses',
    link: '#',
    children: [
      {
        name: 'Courses Style',
        link: '#',
        children: [
          { name: 'Course Style 1', link: '/course-style-1' },
          { name: 'Course Style 2', link: '/course-style-2' },
          { name: 'Course Style 3', link: '/course-style-3' },
          { name: 'Course Style 4', link: '/course-style-4' },
          { name: 'Course Style 5', link: '/course-style-5' },
        ],
      },
      {
        name: 'Course Details',
        link: '#',
        children: [
          { name: 'Course Details 1', link: '/course-details-1' },
          { name: 'Course Details 2', link: '/course-details-2' },
          { name: 'Course Details 3', link: '/course-details-3' },
          { name: 'Course Details 4', link: '/course-details-4' },
          { name: 'Course Details 5', link: '/course-details-5' },
        ],
      },
      {
        name: 'Course Filter',
        link: '#',
        children: [
          { name: 'Filter Sidebar Left', link: '/courses' },
          { name: 'Filter Sidebar Right', link: '/filter-sidebar-right' },
          { name: 'Filter Category', link: '/filter-category' },
        ],
      },
    ],
  },
  {
    name: 'Blog',
    link: '#',
    children: [
      { name: 'Blog Style 1', link: '/blog' },
      { name: 'Blog Style 2', link: '/blog-style-2' },
      { name: 'Blog Standard', link: '/blog-standard' },
      { name: 'Blog Details', link: '/blog-details' },
    ],
  },
  {
    name: 'Contact',
    link: '#',
    children: [
      { name: 'Contact Us', link: '/contact-us' },
      { name: 'Contact Me', link: '/contact-me' },
    ],
  },
];

function RenderNavItem({ item }: { item: MenuItem }) {
  const hasChildren = item.children && item.children.length > 0;
  const hasMegaMenu = !!item.megaMenu;

  return (
    <li className={`${styles.navItem} ${hasMegaMenu ? styles.hasMegaMenu : ''}`}>
      <Link href={item.link} className={styles.navLink}>
        {item.name}
        {(hasChildren || hasMegaMenu) && (
          <span className={styles.arrow}>
            <ChevronDown strokeWidth={3} width={15} height={15} />
          </span>
        )}
      </Link>

      {hasMegaMenu && <div className={styles.megaMenuWrapper}>{item.megaMenu}</div>}

      {!hasMegaMenu && hasChildren && (
        <ul className={styles.submenu}>
          {item.children!.map((child, idx) => (
            <RenderNavItem key={idx} item={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: number; username: string; name?: string } | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // Fetch danh mục khóa học động từ taxonomy course_category
  useEffect(() => {
    async function loadCourseCategories() {
      try {
        const catRes = await fetchLPCategories();
        if (Array.isArray(catRes) && catRes.length > 0) {
          const formattedCategories: CategoryItem[] = catRes.map((c: any) => ({
            id: c.id,
            name: c.name?.replace(/&#038;/g, '&').replace(/&amp;/g, '&') || c.name,
            slug: c.slug,
            link: `/course-category/${c.slug}`,
          }));
          setCategories(formattedCategories);
        }
      } catch (error) {
        console.error("Error loading course categories for header:", error);
      }
    }

    loadCourseCategories();
  }, []);

  useEffect(() => {
    const checkUser = () => {
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
      };

      const cookieVal = getCookie('session_user');
      if (cookieVal) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookieVal));
          if (parsed && (parsed.name || parsed.username)) {
            setUser(parsed);
            return;
          }
        } catch { }
      }
      setUser(null);
    };

    checkUser();

    if (typeof window !== 'undefined') {
      window.addEventListener('user-auth-change', checkUser);
      window.addEventListener('storage', checkUser);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('user-auth-change', checkUser);
        window.removeEventListener('storage', checkUser);
      }
    };
  }, [pathname]);

  return (
    <header className={styles.header}>
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
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

          <div className={styles.loginStatus}>
            {user ? (
              <Link href="/my-account" className={styles.loginLink}>
                Welcome, {user.name || user.username}!
              </Link>
            ) : (
              <Link href="/my-account" className={styles.loginLink}>
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.headerWrapper}>
          {/* Logo thương hiệu */}
          <div className={styles.brandLogo}>
            <Link href="/" className={styles.logoLink}>
              <Image
                src="/images/Site_logo.png"
                alt="Logo"
                width={158}
                height={50}
              />
            </Link>
          </div>

          {/* Menu Danh mục khóa học Động */}
          <div className={styles.categoryDropdown}>
            <button className={styles.categoryBtn}>
              <Grip size={20} className={styles.categoryIcon} />
              <span>Category</span>
            </button>

            <ul className={styles.categoryMenu}>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.id}>
                    <Link href={cat.link}>{cat.name}</Link>
                  </li>
                ))
              ) : (
                <li>
                  <span style={{ padding: '8px 20px', color: '#888', display: 'block' }}>Loading...</span>
                </li>
              )}
            </ul>
          </div>

          {/* Điều hướng chính (Main Navigation) */}
          <nav className={styles.mainNav}>
            <ul className={styles.navList}>
              {navItems.map((item, index) => (
                <RenderNavItem key={index} item={item} />
              ))}
            </ul>
          </nav>

          {/* Thanh tìm kiếm (Search Box) */}
          <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Search..."
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn} aria-label="Search">
              <Search size={18} />
            </button>
          </form>

          {/* Giỏ hàng (Cart Dropdown) */}
          <div className={styles.cartDropdown}>
            <Link href="/cart" className={styles.cartIconBtn} aria-label="Cart">
              <ShoppingCart size={22} />
              <span className={styles.cartBadge}>8</span>
            </Link>

            <div className={styles.cartMenu}>
              <div className={styles.cartItemsList}>
                <div className={styles.cartItem}>
                  <div className={styles.cartItemThumb}>
                    <Image src="/images/book_demo.jpg" alt="Book Demo B" width={75} height={75} />
                  </div>
                  <div className={styles.cartItemInfo}>
                    <h6 className={styles.cartItemTitle}>Book Demo B</h6>
                    <span className={styles.cartItemPrice}>1 × $59.00</span>
                  </div>
                  <button className={styles.cartItemRemove} aria-label="Remove">
                    <X strokeWidth={3} size={16} />
                  </button>
                </div>

                <div className={styles.cartItem}>
                  <div className={styles.cartItemThumb}>
                    <Image src="/images/book_demo.jpg" alt="Book Demo C" width={75} height={75} />
                  </div>
                  <div className={styles.cartItemInfo}>
                    <h6 className={styles.cartItemTitle}>Book Demo C</h6>
                    <span className={styles.cartItemPrice}>1 × $25.00</span>
                  </div>
                  <button className={styles.cartItemRemove} aria-label="Remove">
                    <X strokeWidth={3} size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.cartSubtotalRow}>
                <span>Subtotal:</span>
                <span className={styles.cartSubtotalPrice}>$178.00</span>
              </div>

              <div className={styles.cartActions}>
                <Link href="/cart" className={styles.viewCartBtn}>View cart</Link>
                <Link href="/checkout" className={styles.checkoutBtn}>Checkout</Link>
              </div>
            </div>
          </div>

          {/* Nút đăng ký Call-to-action */}
          <div className={styles.actionBtnGroup}>
            <ButtonGreen className={styles.btnTryForFree} text="Try for free" />
          </div>
        </div>
      </div>
    </header>
  );
}