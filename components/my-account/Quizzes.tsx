'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ClipboardList,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    Trophy,
    CalendarDays,
    Timer,
    RefreshCw,
} from 'lucide-react';
import styles from '@/styles/my-account/Quizzes.module.css';

type QuizStatus = 'passed' | 'failed' | 'in-progress' | 'completed';
type TabType = 'all' | 'passed' | 'failed' | 'in-progress';

interface QuizAttempt {
    id: number | string;
    quizId: number | string;
    title: string;
    slug: string;
    courseTitle: string | null;
    courseSlug: string | null;
    courseId: number | string | null;
    status: QuizStatus;
    score: number | null;
    totalScore: number | null;
    scorePercent: number | null;
    resultLabel: string;
    questionCount: number | null;
    questionCorrect: number | null;
    duration: string | null;
    startedAt: string | null;
    completedAt: string | null;
    attempts: number;
    passingGrade: string | null;
}

interface Counts {
    total: number;
    passed: number;
    failed: number;
    inprogress: number;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: QuizStatus }) {
    switch (status) {
        case 'passed':
            return (
                <span className={`${styles.badge} ${styles.badgePassed}`}>
                    <CheckCircle2 size={12} />
                    Passed
                </span>
            );
        case 'failed':
            return (
                <span className={`${styles.badge} ${styles.badgeFailed}`}>
                    <XCircle size={12} />
                    Failed
                </span>
            );
        case 'completed':
            return (
                <span className={`${styles.badge} ${styles.badgeCompleted}`}>
                    <CheckCircle2 size={12} />
                    Completed
                </span>
            );
        default:
            return (
                <span className={`${styles.badge} ${styles.badgeProgress}`}>
                    <Clock size={12} />
                    In Progress
                </span>
            );
    }
}

export default function Quizzes() {
    const [quizzes, setQuizzes] = useState<QuizAttempt[]>([]);
    const [counts, setCounts] = useState<Counts>({ total: 0, passed: 0, failed: 0, inprogress: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('all');

    const fetchQuizzes = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            // cache: 'no-store' đảm bảo luôn lấy dữ liệu mới nhất từ WordPress
            const res = await fetch('/api/user/quizzes', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setQuizzes(data.quizzes || []);
                if (data.counts) setCounts(data.counts);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách quiz:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredQuizzes = quizzes.filter((q) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'in-progress') return q.status === 'in-progress';
        return q.status === activeTab;
    });

    const tabs: { key: TabType; label: string }[] = [
        { key: 'all', label: `All (${counts.total})` },
        { key: 'passed', label: 'Passed' },
        { key: 'failed', label: 'Failed' },
        { key: 'in-progress', label: 'In Progress' },
    ];

    const getScoreBarColor = (status: QuizStatus) => {
        if (status === 'passed') return styles.colorPassed;
        if (status === 'failed') return styles.colorFailed;
        return styles.colorDefault;
    };

    return (
        <div className={styles.container}>
            {/* ── Header: title + refresh button ── */}
            <div className={styles.headerRow}>
                <div>
                    <h2 className={styles.pageTitle}>My Quizzes</h2>
                    {lastUpdated && (
                        <p className={styles.lastUpdated}>
                            Last synced: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    className={styles.refreshBtn}
                    onClick={() => fetchQuizzes(true)}
                    disabled={refreshing || loading}
                    title="Sync latest quiz results from WordPress"
                >
                    <RefreshCw
                        size={15}
                        className={refreshing ? styles.spinIcon : ''}
                    />
                    {refreshing ? 'Syncing…' : 'Sync now'}
                </button>
            </div>

            {/* ── Stats Cards ── */}
            <div className={styles.statsGrid}>
                {/* Total */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.bgTotal}`}>
                        <ClipboardList size={20} color="#0284c7" />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Total Quizzes</span>
                        <span className={styles.statValue}>{counts.total}</span>
                    </div>
                </div>

                {/* Passed */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.bgPassed}`}>
                        <Trophy size={20} color="#16a34a" />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Passed</span>
                        <span className={styles.statValue}>{counts.passed}</span>
                    </div>
                </div>

                {/* Failed */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.bgFailed}`}>
                        <XCircle size={20} color="#dc2626" />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Failed</span>
                        <span className={styles.statValue}>{counts.failed}</span>
                    </div>
                </div>

                {/* In Progress */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.bgProgress}`}>
                        <Clock size={20} color="#a16207" />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>In Progress</span>
                        <span className={styles.statValue}>{counts.inprogress}</span>
                    </div>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
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

            {/* ── Content ── */}
            {loading ? (
                <div className={styles.loadingWrapper}>
                    <Loader2 className="animate-spin" size={32} color="#1ab69d" />
                </div>
            ) : filteredQuizzes.length === 0 ? (
                <div className={styles.emptyState}>
                    <ClipboardList size={52} className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>No quizzes found</p>
                    <p className={styles.emptySubtitle}>
                        {activeTab === 'all'
                            ? "You haven't taken any quizzes yet."
                            : `No ${activeTab} quizzes to display.`}
                    </p>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.quizTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Quiz</th>
                                <th style={{ width: '16%' }}>Result</th>
                                <th style={{ width: '14%' }}>Correct / Total</th>
                                <th style={{ width: '12%' }}>Status</th>
                                <th style={{ width: '12%' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Timer size={12} /> Time
                                    </span>
                                </th>
                                <th style={{ width: '16%' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <CalendarDays size={12} /> Completed
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuizzes.map((quiz) => (
                                <tr key={`${quiz.id}`}>
                                    {/* Quiz Title */}
                                    <td>
                                        <div className={styles.quizTitleBox}>
                                            {quiz.slug || quiz.quizId ? (
                                                <Link
                                                    href={`/courses/${quiz.courseSlug || 'unknown'}/quizzes/${quiz.slug || quiz.quizId}`}
                                                    className={styles.quizTitleLink}
                                                >
                                                    {quiz.title}
                                                </Link>
                                            ) : (
                                                <span className={styles.quizTitle}>{quiz.title}</span>
                                            )}
                                            {quiz.passingGrade && (
                                                <span className={styles.courseLabel}>
                                                    Passing grade: {quiz.passingGrade}
                                                </span>
                                            )}
                                            {quiz.courseTitle && (
                                                <span className={styles.courseLabel}>
                                                    Course:{' '}
                                                    {quiz.courseSlug ? (
                                                        <Link
                                                            href={`/courses/${quiz.courseSlug}`}
                                                            className={styles.courseLabelLink}
                                                        >
                                                            {quiz.courseTitle}
                                                        </Link>
                                                    ) : (
                                                        quiz.courseTitle
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Result % */}
                                    <td>
                                        {quiz.scorePercent !== null ? (
                                            <div className={styles.scoreBox}>
                                                <span className={styles.scoreValue}>
                                                    {quiz.resultLabel || `${quiz.scorePercent}%`}
                                                </span>
                                                <div className={styles.scoreBar}>
                                                    <div
                                                        className={`${styles.scoreBarFill} ${getScoreBarColor(quiz.status)}`}
                                                        style={{ width: `${Math.min(100, quiz.scorePercent)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className={styles.dash}>—</span>
                                        )}
                                    </td>

                                    {/* Correct / Total questions */}
                                    <td>
                                        {quiz.questionCorrect !== null && quiz.questionCount !== null ? (
                                            <span className={styles.dimText}>
                                                {quiz.questionCorrect}<span style={{ color: '#cbd5e1' }}>/{quiz.questionCount}</span>
                                            </span>
                                        ) : (
                                            <span className={styles.dash}>—</span>
                                        )}
                                    </td>

                                    {/* Status badge */}
                                    <td>
                                        <StatusBadge status={quiz.status} />
                                    </td>

                                    {/* Time spent */}
                                    <td>
                                        <span className={styles.dimText}>{quiz.duration || '—'}</span>
                                    </td>

                                    {/* Completed date */}
                                    <td>
                                        <span className={styles.dimText}>{formatDate(quiz.completedAt)}</span>
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
