'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LoginRegister.module.css';
import SideBar from './SideBar';

interface LoggedInAccountProps {
  user?: {
    id?: number;
    username?: string;
    email?: string;
    name?: string;
  };
  children?: React.ReactNode;
}

export default function LoggedInAccount({ children }: LoggedInAccountProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('user-auth-change'));
      }
      router.refresh();
      router.push('/my-account');
    } catch {
      alert('Đã xảy ra lỗi khi đăng xuất.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.hn_login_register_site_content}>
      <div className={styles.hn_login_register_container}>
        <div className={styles.hn_login_register_main_row}>
          <div className={styles.hn_login_register_columns}>
            <div className={styles.hn_login_register_sidebar_col}>
              <SideBar handleLogout={handleLogout} />
            </div>
            <div className={styles.hn_login_register_content_col}>
              {children || (
                <div style={{ padding: '28px', background: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 700, color: '#1e2445' }}>
                    Dashboard
                  </h2>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
                    Chào mừng bạn đến với trang quản lý tài khoản. Hãy chọn các mục từ thanh điều hướng bên trái để xem và chỉnh sửa Thông tin cá nhân, Khóa học đã đăng ký, Chứng chỉ cũng như Lịch sử đơn hàng.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
