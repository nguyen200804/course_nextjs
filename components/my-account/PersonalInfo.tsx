'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import styles from '@/styles/my-account/PersonalInfo.module.css';

export default function PersonalInfo() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // 1. Gọi hook lấy Account Details từ WordPress / WooCommerce API
    useEffect(() => {
        const fetchAccountDetails = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/user/account-details');
                if (res.ok) {
                    const data = await res.json();
                    setFormData((prev) => ({
                        ...prev,
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        displayName: data.displayName || '',
                        email: data.email || '',
                    }));
                }
            } catch (err) {
                console.error("Lỗi khi tải thông tin Account Details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAccountDetails();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // 2. Hook gửi yêu cầu lưu Account Details & Đổi mật khẩu lên WordPress
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/user/account-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setMessage({ type: 'success', text: data.message || 'Account details changed successfully.' });
                // Reset ô nhập mật khẩu sau khi đổi thành công
                setFormData((prev) => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                }));
            } else {
                setMessage({ type: 'error', text: data.error || 'Could not update account details.' });
            }
        } catch (err) {
            console.error("Lỗi khi lưu Account Details:", err);
            setMessage({ type: 'error', text: 'An error occurred while saving changes. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: '#1ab69d' }} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Alert Message */}
            {message && (
                <div style={{
                    padding: '14px 18px',
                    borderRadius: '6px',
                    marginBottom: '24px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: message.type === 'success' ? '#16a34a' : '#dc2626',
                    border: message.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca'
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Name Row: First Name & Last Name */}
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label htmlFor="firstName" className={styles.label}>
                            First name <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="lastName" className={styles.label}>
                            Last name <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>
                </div>

                {/* Display Name */}
                <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                    <label htmlFor="displayName" className={styles.label}>
                        Display name <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        className={styles.input}
                        required
                    />
                    <span className={styles.fieldHint}>
                        This will be how your name will be displayed in the account section and in reviews
                    </span>
                </div>

                {/* Email Address */}
                <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                    <label htmlFor="email" className={styles.label}>
                        Email address <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={styles.input}
                        required
                    />
                </div>

                {/* Password Change Fieldset */}
                <fieldset className={styles.fieldset} style={{ marginTop: '30px' }}>
                    <legend className={styles.legend}>Password change</legend>

                    {/* Current Password */}
                    <div className={styles.formGroup}>
                        <label htmlFor="currentPassword" className={styles.label}>
                            Current password (leave blank to leave unchanged)
                        </label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                id="currentPassword"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                className={styles.input}
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                        <label htmlFor="newPassword" className={styles.label}>
                            New password (leave blank to leave unchanged)
                        </label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className={styles.input}
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                        <label htmlFor="confirmPassword" className={styles.label}>
                            Confirm new password
                        </label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={styles.input}
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </fieldset>

                {/* Submit Button */}
                <div style={{ marginTop: '24px' }}>
                    <button type="submit" className={styles.saveChangesBtn} disabled={saving}>
                        {saving ? (
                            <>
                                <span>Saving...</span>
                                <Loader2 className="animate-spin" size={16} />
                            </>
                        ) : (
                            'Save changes'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}