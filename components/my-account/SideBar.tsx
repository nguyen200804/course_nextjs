'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRound, Gauge, LibraryBig, Award, RotateCcwIcon, LogOut } from 'lucide-react';
import styles from '@/styles/my-account/SideBar.module.css';

export default function SideBar({ handleLogout }: { handleLogout: () => void }) {
    const pathname = usePathname();

    const navItems = [
        { href: '/my-account', label: 'Dashboard', icon: Gauge },
        { href: '/my-account/personal-info', label: 'Personal Info', icon: UserRound },
        { href: '/my-account/my-courses', label: 'My Courses', icon: LibraryBig },
        { href: '/my-account/certificates', label: 'Certificates', icon: Award },
        { href: '/my-account/order-history', label: 'Order History', icon: RotateCcwIcon },
    ];

    return (
        <div className={styles.sidebar}>
            <ul className={styles.navList}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <li key={item.href} className={styles.navItem}>
                            <Link
                                href={item.href}
                                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
            <button type="button" className={styles.btn} onClick={() => handleLogout()}>
                <LogOut size={18} />
                <span>Sign Out</span>
            </button>
        </div>
    );
}