'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import styles from '@/styles/my-account/PersonalInfo.module.css';

export default function PersonalInfo() {
    const [activeTab, setActiveTab] = useState<'general' | 'avatar' | 'password'>('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // General Form State
    const [generalData, setGeneralData] = useState({
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        bio: '',
        facebook: '',
        xProfile: '',
        youtube: '',
        linkedin: '',
    });

    // Avatar State
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Password Form State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Fetch user profile info on mount
    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/user/account-details');
                if (res.ok) {
                    const data = await res.json();
                    setGeneralData({
                        firstName: data.firstName || data.first_name || '',
                        lastName: data.lastName || data.last_name || '',
                        displayName: data.displayName || data.display_name || '',
                        email: data.email || '',
                        bio: data.bio || data.description || '',
                        facebook: data.facebook || '',
                        xProfile: data.xProfile || data.x_twitter || '',
                        youtube: data.youtube || '',
                        linkedin: data.linkedin || '',
                    });
                    if (data.avatarUrl || data.avatar_url) {
                        setAvatarPreview(data.avatarUrl || data.avatar_url);
                    }
                }
            } catch (err) {
                console.error("Lỗi khi tải thông tin cá nhân:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setGeneralData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    // Submit General Info
    const handleGeneralSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/user/account-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(generalData),
            });

            const data = await res.json();

            if (res.ok && (data.success ?? true)) {
                setMessage({ type: 'success', text: data.message || 'General information updated successfully.' });
            } else {
                setMessage({ type: 'error', text: data.error || data.message || 'Could not update profile info.' });
            }
        } catch (err) {
            console.error("Lỗi khi lưu thông tin:", err);
            setMessage({ type: 'error', text: 'An error occurred while saving changes. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    // Submit Avatar Upload
    const handleAvatarSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!avatarFile) {
            setMessage({ type: 'error', text: 'Please select an image file to upload.' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('avatar', avatarFile);

            const res = await fetch('/api/user/profile', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok && (data.success ?? true)) {
                setMessage({ type: 'success', text: data.message || 'Avatar updated successfully.' });
            } else {
                setMessage({ type: 'error', text: data.error || data.message || 'Could not update avatar.' });
            }
        } catch (err) {
            console.error("Lỗi khi upload avatar:", err);
            setMessage({ type: 'error', text: 'An error occurred while uploading avatar.' });
        } finally {
            setSaving(false);
        }
    };

    // Submit Password Change
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New password and confirm password do not match.' });
            return;
        }

        setSaving(true);

        try {
            const res = await fetch('/api/user/account-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await res.json();

            if (res.ok && (data.success ?? true)) {
                setMessage({ type: 'success', text: data.message || 'Password changed successfully.' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: data.error || data.message || 'Could not change password.' });
            }
        } catch (err) {
            console.error("Lỗi khi đổi mật khẩu:", err);
            setMessage({ type: 'error', text: 'An error occurred while changing password.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={`${styles.container} ${styles.loaderWrapper}`}>
                <Loader2 className={styles.spinner} size={32} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Tab Navigation */}
            <div className={styles.tabNav}>
                <button
                    type="button"
                    onClick={() => { setActiveTab('general'); setMessage(null); }}
                    className={`${styles.tabBtn} ${activeTab === 'general' ? styles.tabBtnActive : ''}`}
                >
                    <span>General</span>
                </button>

                <button
                    type="button"
                    onClick={() => { setActiveTab('avatar'); setMessage(null); }}
                    className={`${styles.tabBtn} ${activeTab === 'avatar' ? styles.tabBtnActive : ''}`}
                >
                    <span>Avatar</span>
                </button>

                <button
                    type="button"
                    onClick={() => { setActiveTab('password'); setMessage(null); }}
                    className={`${styles.tabBtn} ${activeTab === 'password' ? styles.tabBtnActive : ''}`}
                >
                    <span>Password</span>
                </button>
            </div>

            {/* Alert Message */}
            {message && (
                <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                    {message.text}
                </div>
            )}

            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
                <form onSubmit={handleGeneralSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label htmlFor="firstName" className={styles.label}>
                                First name
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={generalData.firstName}
                                onChange={handleGeneralChange}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="lastName" className={styles.label}>
                                Last name
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={generalData.lastName}
                                onChange={handleGeneralChange}
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGroupMargin}`}>
                        <label htmlFor="displayName" className={styles.label}>
                            Display name <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={generalData.displayName}
                            onChange={handleGeneralChange}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGroupMargin}`}>
                        <label htmlFor="email" className={styles.label}>
                            Email Address <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={generalData.email}
                            onChange={handleGeneralChange}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGroupMargin}`}>
                        <label htmlFor="bio" className={styles.label}>
                            Biographical Info
                        </label>
                        <textarea
                            id="bio"
                            name="bio"
                            rows={4}
                            value={generalData.bio}
                            onChange={handleGeneralChange}
                            className={`${styles.input} ${styles.textareaInput}`}
                        />
                    </div>

                    <p className={`${styles.fieldHint}`}>Share a little biographical information to fill out your profile. This may be shown publicly.</p>



                    <div className={styles.formGroup}>
                        <label htmlFor="facebook" className={styles.label}>
                            Facebook Profile
                        </label>
                        <input
                            type="url"
                            id="facebook"
                            name="facebook"
                            placeholder="https://facebook.com/your-profile"
                            value={generalData.facebook}
                            onChange={handleGeneralChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGroupMargin}`}>
                        <label htmlFor="xProfile" className={styles.label}>
                            X Profile
                        </label>
                        <input
                            type="url"
                            id="xProfile"
                            name="xProfile"
                            placeholder="https://x.com/your-profile"
                            value={generalData.xProfile}
                            onChange={handleGeneralChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGroupMargin}`}>
                        <label htmlFor="youtube" className={styles.label}>
                            Youtube Channel
                        </label>
                        <input
                            type="url"
                            id="youtube"
                            name="youtube"
                            placeholder="https://youtube.com/c/your-channel"
                            value={generalData.youtube}
                            onChange={handleGeneralChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGroupMargin}`}>
                        <label htmlFor="linkedin" className={styles.label}>
                            Linkedin Profile
                        </label>
                        <input
                            type="url"
                            id="linkedin"
                            name="linkedin"
                            placeholder="https://linkedin.com/in/your-profile"
                            value={generalData.linkedin}
                            onChange={handleGeneralChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.btnGroup}>
                        <button type="submit" className={styles.saveChangesBtn} disabled={saving}>
                            {saving ? (
                                <>
                                    <span>Saving...</span>
                                    <Loader2 className={styles.spinner} size={16} />
                                </>
                            ) : (
                                'Save changes'
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB 2: AVATAR */}
            {activeTab === 'avatar' && (
                <form onSubmit={handleAvatarSubmit} className={styles.form}>
                    <div className={styles.avatarWrapper}>
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Avatar Preview"
                                className={styles.avatarImg}
                            />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                No Avatar
                            </div>
                        )}

                        <label className={styles.chooseImageBtn}>
                            Choose Image
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarFileChange}
                                className={styles.fileInput}
                            />
                        </label>
                    </div>

                    <div className={styles.btnGroupCenter}>
                        <button type="submit" className={styles.saveChangesBtn} disabled={saving || !avatarFile}>
                            {saving ? (
                                <>
                                    <span>Uploading...</span>
                                    <Loader2 className={styles.spinner} size={16} />
                                </>
                            ) : (
                                'Upload Avatar'
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB 3: PASSWORD */}
            {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit} className={styles.form}>
                    {/* Current Password */}
                    <div className={styles.formGroup}>
                        <label htmlFor="currentPassword" className={styles.label}>
                            Current password <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                id="currentPassword"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className={styles.input}
                                required
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
                    <div className={`${styles.formGroup} ${styles.formGroupMargin}`}>
                        <label htmlFor="newPassword" className={styles.label}>
                            New password <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className={styles.input}
                                required
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
                    <div className={`${styles.formGroup} ${styles.formGroupMargin}`}>
                        <label htmlFor="confirmPassword" className={styles.label}>
                            Confirm new password <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className={styles.input}
                                required
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

                    <div className={styles.btnGroup}>
                        <button type="submit" className={styles.saveChangesBtn} disabled={saving}>
                            {saving ? (
                                <>
                                    <span>Updating...</span>
                                    <Loader2 className={styles.spinner} size={16} />
                                </>
                            ) : (
                                'Change password'
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}