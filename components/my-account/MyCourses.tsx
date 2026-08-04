'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Award, CheckSquare, XSquare, Loader2 } from 'lucide-react';
import styles from '@/styles/my-account/MyCourses.module.css';

export type CourseStatus = 'in-progress' | 'finished' | 'passed' | 'failed';

interface Course {
    id: number | string;
    title: string;
    slug: string;
    description: string;
    image: string;
    progress: number;
    courseProgress?: string;
    passingGradeProgress?: string;
    status: CourseStatus;
    result: string;
    expirationTime: string;
    endTime: string;
}

type TabType = 'all' | 'in-progress' | 'finished' | 'passed' | 'failed';

export default function MyCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [counts, setCounts] = useState({
        enrolled: 0,
        inprogress: 0,
        finished: 0,
        passed: 0,
        failed: 0,
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('in-progress');

    // 1. Hook danh sách khóa học và các chỉ số thống kê từ WordPress API theo đúng User
    useEffect(() => {
        const fetchUserCourses = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/user/my-courses');
                if (res.ok) {
                    const data = await res.json();
                    const list: Course[] = data.courses || [];
                    setCourses(list);
                    if (data.counts) {
                        setCounts(data.counts);
                    }

                    // Xuất console.log Course progress: và Passing grade progress: của các khóa học liên quan đến User
                    list.forEach((c) => {
                        console.log(`[MyCourses] Khóa học "${c.title}":`);
                        console.log(`- Course progress: ${c.courseProgress || c.result}`);
                        console.log(`- Passing grade progress: ${c.passingGradeProgress || '80%'}`);
                    });
                }
            } catch (err) {
                console.error("Lỗi khi tải danh sách khóa học của học viên:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserCourses();
    }, []);

    // 2. Lọc danh sách theo Tab active
    const filteredCourses = courses.filter((course) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'in-progress') return course.status === 'in-progress';
        if (activeTab === 'finished') return course.status === 'finished';
        if (activeTab === 'passed') return course.status === 'passed';
        if (activeTab === 'failed') return course.status === 'failed';
        return true;
    });

    const tabs: { key: TabType; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'in-progress', label: 'In Progress' },
        { key: 'finished', label: 'Finished' },
        { key: 'passed', label: 'Passed' },
        { key: 'failed', label: 'Failed' },
    ];

    return (
        <div className={styles.container}>
            {/* Stat Cards Grid */}
            <div className={styles.statsGrid}>
                {/* 1. Enrolled Course */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.bgEnrolled}`}>
                        <BookOpen size={20} color="#14b8a6" />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Enrolled Course</span>
                        <span className={styles.statValue}>{counts.enrolled}</span>
                    </div>
                </div>

                {/* 2. Inprogress Course */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.bgInprogress}`}>
                        <Clock size={20} color="#a855f7" />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Inprogress Course</span>
                        <span className={styles.statValue}>{counts.inprogress}</span>
                    </div>
                </div>

                {/* 3. Finished Course */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.bgFinished}`}>
                        <Award size={20} color="#3b82f6" />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Finished Course</span>
                        <span className={styles.statValue}>{counts.finished}</span>
                    </div>
                </div>

                {/* 4. Passed Course */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.bgPassed}`}>
                        <CheckSquare size={20} color="#22c55e" />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Passed Course</span>
                        <span className={styles.statValue}>{counts.passed}</span>
                    </div>
                </div>

                {/* 5. Failed Course */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.bgFailed}`}>
                        <XSquare size={20} color="#ef4444" />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Failed Course</span>
                        <span className={styles.statValue}>{counts.failed}</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs Navigation */}
            <div className={styles.tabsNav}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`${styles.tabBtn} ${activeTab === tab.key ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Loading & Table State */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: '#f59e0b' }} />
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No courses found in this section.</p>
                </div>
            ) : (
                /* Course Table */
                <div className={styles.tableWrapper}>
                    <table className={styles.courseTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Name</th>
                                <th style={{ width: '20%' }}>Result</th>
                                <th style={{ width: '25%' }}>Expiration time</th>
                                <th style={{ width: '15%' }}>End time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.map((course) => (
                                <tr key={course.id}>
                                    {/* Name & Thumbnail */}
                                    <td>
                                        <div className={styles.courseNameBox}>
                                            <img
                                                src={course.image}
                                                alt={course.title}
                                                className={styles.tableThumb}
                                            />
                                            <Link href={`/courses/${course.slug}`} className={styles.courseTitleLink}>
                                                {course.title}
                                            </Link>
                                        </div>
                                    </td>

                                    {/* Result - Passing grade progress */}
                                    <td>
                                        <span className={styles.resultText}>{course.result}</span>
                                    </td>

                                    {/* Expiration time */}
                                    <td>
                                        <span className={styles.timeText}>{course.expirationTime}</span>
                                    </td>

                                    {/* End time */}
                                    <td>
                                        <span className={styles.timeText}>{course.endTime}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
