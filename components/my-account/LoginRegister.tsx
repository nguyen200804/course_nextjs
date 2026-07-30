'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ButtonGreen from '@/components/common/ButtonGreen';
import styles from './LoginRegister.module.css';

export default function LoginRegister() {
  const router = useRouter();

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Register Form States
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Handle WordPress API Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);

    if (!loginUsername || !loginPassword) {
      setLoginError('Vui lòng nhập Username/Email và Mật khẩu.');
      return;
    }

    setLoginLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      } else {
        setLoginSuccess(`Đăng nhập thành công! Xin chào ${data.user?.name || data.user?.username || ''}.`);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('user-auth-change'));
        }
        setTimeout(() => {
          router.push('/my-account');
          router.refresh();
        }, 1500);
      }
    } catch {
      setLoginError('Đã xảy ra lỗi kết nối tới máy chủ WordPress.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle WordPress API Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regEmail || !regPassword) {
      setRegError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setRegLoading(true);

    // Tạo username từ tên Email
    const rawUsername = regEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueUsername = `${rawUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: uniqueUsername,
          email: regEmail,
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegError(data.error || 'Đăng ký tài khoản thất bại.');
      } else {
        setRegSuccess('Đăng ký tài khoản WordPress thành công! Bạn có thể dùng thông tin này để đăng nhập.');
        setRegEmail('');
        setRegPassword('');
      }
    } catch {
      setRegError('Đã xảy ra lỗi hệ thống khi kết nối tới WordPress.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div id="content" className={styles.hn_login_register_site_content}>
      <div className={styles.hn_login_register_container}>
        <div className={styles.hn_login_register_main_row}>
          <div id="primary" className={styles.hn_login_register_content_area}>
            <main id="main" className={styles.hn_login_register_main}>
              <article id="post-23" className={styles.hn_login_register_article}>
                <div className={styles.hn_login_register_entry_content}>
                  <div className={styles.hn_login_register_woocommerce}>
                    <div className={styles.hn_login_register_notices_wrapper}></div>

                    <div id="customer_login" className={styles.hn_login_register_columns}>
                      {/* Login Box */}
                      <div className={styles.hn_login_register_column_login}>
                        <h2 className={styles.hn_login_register_heading}>Login</h2>

                        {loginError && <div className={styles.hn_login_register_error_msg}>{loginError}</div>}
                        {loginSuccess && <div className={styles.hn_login_register_success_msg}>{loginSuccess}</div>}

                        <form className={styles.hn_login_register_login_form} onSubmit={handleLoginSubmit} noValidate>
                          <p className={styles.hn_login_register_form_row}>
                            <label htmlFor="username" className={styles.hn_login_register_label}>
                              Username or email address&nbsp;
                              <span className={styles.hn_login_register_required} aria-hidden="true">*</span>
                              <span className={styles.hn_login_register_screen_reader}>Required</span>
                            </label>
                            <input
                              type="text"
                              className={styles.hn_login_register_input}
                              name="username"
                              id="username"
                              autoComplete="username"
                              value={loginUsername}
                              onChange={(e) => setLoginUsername(e.target.value)}
                              required
                              aria-required="true"
                              disabled={loginLoading}
                            />
                          </p>

                          <p className={styles.hn_login_register_form_row}>
                            <label htmlFor="password" className={styles.hn_login_register_label}>
                              Password&nbsp;
                              <span className={styles.hn_login_register_required} aria-hidden="true">*</span>
                              <span className={styles.hn_login_register_screen_reader}>Required</span>
                            </label>
                            <span className={styles.hn_login_register_password_wrapper}>
                              <input
                                className={styles.hn_login_register_input}
                                type={showLoginPassword ? 'text' : 'password'}
                                name="password"
                                id="password"
                                autoComplete="current-password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                                aria-required="true"
                                disabled={loginLoading}
                              />
                              <button
                                type="button"
                                className={styles.hn_login_register_password_toggle}
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                aria-label="Toggle password visibility"
                              >
                                <i className={showLoginPassword ? 'ri-eye-line' : 'ri-eye-off-line'}></i>
                              </button>
                            </span>
                          </p>

                          <div className={styles.hn_login_register_action_row}>
                            <label className={styles.hn_login_register_checkbox_label}>
                              <input
                                className={styles.hn_login_register_checkbox}
                                name="rememberme"
                                type="checkbox"
                                id="rememberme"
                                value="forever"
                              />
                              <span>Remember me</span>
                            </label>

                            <ButtonGreen
                              type="submit"
                              name="login"
                              value="Log in"
                              text={loginLoading ? 'Logging in...' : 'Log in'}
                              showIcon={false}
                              className={styles.hn_login_register_submit_btn}
                              disabled={loginLoading}
                            />
                          </div>

                          <p className={styles.hn_login_register_lost_password}>
                            <Link href="/my-account/lost-password" className={styles.hn_login_register_lost_password_link}>
                              Lost your password?
                            </Link>
                          </p>
                        </form>
                      </div>

                      {/* Register Box */}
                      <div className={styles.hn_login_register_column_register}>
                        <h2 className={styles.hn_login_register_heading}>Register</h2>

                        {regError && <div className={styles.hn_login_register_error_msg}>{regError}</div>}
                        {regSuccess && <div className={styles.hn_login_register_success_msg}>{regSuccess}</div>}

                        <form className={styles.hn_login_register_register_form} onSubmit={handleRegisterSubmit}>
                          <p className={styles.hn_login_register_form_row}>
                            <label htmlFor="reg_email" className={styles.hn_login_register_label}>
                              Email address&nbsp;
                              <span className={styles.hn_login_register_required} aria-hidden="true">*</span>
                              <span className={styles.hn_login_register_screen_reader}>Required</span>
                            </label>
                            <input
                              type="email"
                              className={styles.hn_login_register_input}
                              name="email"
                              id="reg_email"
                              autoComplete="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              required
                              aria-required="true"
                              disabled={regLoading}
                            />
                          </p>

                          <p className={styles.hn_login_register_form_row}>
                            <label htmlFor="reg_password" className={styles.hn_login_register_label}>
                              Password&nbsp;
                              <span className={styles.hn_login_register_required} aria-hidden="true">*</span>
                              <span className={styles.hn_login_register_screen_reader}>Required</span>
                            </label>
                            <span className={styles.hn_login_register_password_wrapper}>
                              <input
                                type={showRegPassword ? 'text' : 'password'}
                                className={styles.hn_login_register_input}
                                name="password"
                                id="reg_password"
                                autoComplete="new-password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                required
                                aria-required="true"
                                disabled={regLoading}
                              />
                              <button
                                type="button"
                                className={styles.hn_login_register_password_toggle}
                                onClick={() => setShowRegPassword(!showRegPassword)}
                                aria-label="Toggle password visibility"
                              >
                                <i className={showRegPassword ? 'ri-eye-line' : 'ri-eye-off-line'}></i>
                              </button>
                            </span>
                          </p>

                          <div className={styles.hn_login_register_privacy_policy}>
                            <p>
                              Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our{' '}
                              <Link href="/privacy-policy" className={styles.hn_login_register_privacy_link}>
                                privacy policy
                              </Link>.
                            </p>
                          </div>

                          <p className={styles.hn_login_register_submit_row}>
                            <ButtonGreen
                              type="submit"
                              name="register"
                              value="Register"
                              text={regLoading ? 'Registering...' : 'Register'}
                              showIcon={false}
                              className={styles.hn_login_register_register_btn}
                              disabled={regLoading}
                            />
                          </p>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
