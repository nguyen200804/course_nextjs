"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./LearnPressPopup.module.css";

interface LessonViewWrapperProps {
  displayOptions?: any;
  activeLesson: any;
  course?: any;
  courseId: string;
  lessonId: string;
  completedLessons?: number[];
  user?: any;
  slug: string;
  lessons?: any[];
  sections?: any[];
  canAccess?: boolean;
  isLockedByProgression?: boolean;
  previousLesson?: any;
  progress?: any;
}

const decodeEntities = (text?: string) => {
  if (!text) return "";
  return text
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
};

export default function LessonViewWrapper({
  activeLesson,
  course,
  courseId,
  lessonId,
  completedLessons = [],
  user,
  slug,
  lessons = [],
  sections = [],
  canAccess = true,
}: LessonViewWrapperProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [completedList, setCompletedList] = useState<number[]>(completedLessons || []);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isFinishingCourse, setIsFinishingCourse] = useState(false);
  const [isCourseFinished, setIsCourseFinished] = useState(
    course?.user_course_status === "finished" || course?.status === "finished"
  );
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentPosted, setCommentPosted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const [passingGradeState, setPassingGradeState] = useState<number>(
    Number(course?.passingGrade || course?._lp_passing_condition || 80)
  );

  useEffect(() => {
    if (completedLessons && Array.isArray(completedLessons)) {
      setCompletedList(completedLessons);
    }
  }, [completedLessons]);

  useEffect(() => {
    if (user?.id && courseId) {
      fetch(`/wp-json/custom/v1/course-progress?user_id=${user.id}&course_id=${courseId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (Array.isArray(data.completed_lessons) && data.completed_lessons.length > 0) {
              setCompletedList((prev) =>
                Array.from(new Set([...prev, ...data.completed_lessons.map((id: any) => Number(id))]))
              );
            }
            if (data.passing_grade) {
              setPassingGradeState(Number(data.passing_grade));
            }
            if (data.user_course_status === "finished") {
              setIsCourseFinished(true);
            }
          }
        })
        .catch(() => { });
    }
  }, [user?.id, courseId]);

  // Flatten curriculum items from sections or fallback to lessons array
  const allCurriculumItems = useMemo(() => {
    const list: any[] = [];
    if (sections && Array.isArray(sections) && sections.length > 0) {
      sections.forEach((sec, sIdx) => {
        if (sec.items && Array.isArray(sec.items)) {
          sec.items.forEach((it: any, iIdx: number) => {
            const rawId = (it.item_id || it.id).toString();
            const itSlug = it.slug || rawId;
            const itTitle = typeof it.title === "object" ? it.title.rendered : (it.title || it.name || it.post_title || `Bài học #${rawId}`);
            const itContent = it.post_content || it.content || it.description || "";
            list.push({
              id: rawId,
              slug: itSlug,
              title: decodeEntities(itTitle),
              content: itContent,
              type: it.item_type || it.type || (itTitle.toLowerCase().includes("quiz") || itTitle.toLowerCase().includes("review") ? "lp_quiz" : "lp_lesson"),
              duration: it.duration || (it.item_type === "lp_quiz" ? "1 minute" : `${(iIdx + 1) * 3 + 2} minutes`),
              questions_count: it.questions_count || (it.item_type === "lp_quiz" || itTitle.toLowerCase().includes("quiz") || itTitle.toLowerCase().includes("review") ? "2 questions" : ""),
              section_id: sec.section_id || `sec-${sIdx}`,
              section_title: sec.section_name || sec.title || `Section ${sIdx + 1}`,
            });
          });
        }
      });
    }

    if (list.length === 0 && lessons && Array.isArray(lessons)) {
      lessons.forEach((l: any, idx: number) => {
        const rawId = (l.id || l.item_id).toString();
        const lSlug = l.slug || rawId;
        const lTitle = typeof l.title === "object" ? l.title.rendered : (l.title || l.name || l.post_title || `Bài học #${rawId}`);
        const lContent = l.content || l.post_content || "";
        list.push({
          id: rawId,
          slug: lSlug,
          title: decodeEntities(lTitle),
          content: lContent,
          type: l.type || l.item_type || "lp_lesson",
          duration: `${(idx + 1) * 4} minutes`,
          questions_count: l.type === "lp_quiz" ? "2 questions" : "",
          section_id: "sec-0",
          section_title: "Curriculum",
        });
      });
    }

    return list;
  }, [sections, lessons]);

  // Active Item, Index, Prev and Next items
  const activeItem = allCurriculumItems.find((it) => it.id === lessonId || it.slug === lessonId);
  const activeIndex = allCurriculumItems.findIndex((it) => it.id === lessonId || it.slug === lessonId);
  const prevItem = activeIndex > 0 ? allCurriculumItems[activeIndex - 1] : null;
  const nextItem = activeIndex >= 0 && activeIndex < allCurriculumItems.length - 1 ? allCurriculumItems[activeIndex + 1] : null;

  // Calculate Progress
  const totalItemsCount = allCurriculumItems.length || 1;
  const activeId = activeItem?.id || lessonId;
  const isCurrentCompleted = completedList.includes(Number(activeId)) || completedList.includes(activeId as any);
  const completedCount = allCurriculumItems.filter((it) => completedList.includes(Number(it.id)) || completedList.includes(it.id as any)).length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalItemsCount) * 100));

  const courseTitle = decodeEntities(course?.title?.rendered || "Course Learning");

  const rawLessonTitle = activeLesson?.title?.rendered || activeItem?.title || `Lesson`;
  const lessonTitle = decodeEntities(rawLessonTitle.includes("Bài học #") && activeItem?.title ? activeItem.title : rawLessonTitle);

  const fetchedContent = activeLesson?.content?.rendered || activeLesson?.post_content;
  const lessonContentHtml = (fetchedContent && !fetchedContent.includes("Nội dung bài học đang được cập nhật..."))
    ? fetchedContent
    : (activeItem?.content || fetchedContent || "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>");

  const isQuiz = activeLesson?.item_type === "lp_quiz" || activeLesson?.type === "lp_quiz" || activeItem?.type === "lp_quiz" || lessonTitle.toLowerCase().includes("quiz") || lessonTitle.toLowerCase().includes("review");

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return [
        {
          section_id: "default-sec",
          title: "Curriculum",
          items: allCurriculumItems,
        },
      ];
    }

    return sections.map((sec, sIdx) => {
      const items = (sec.items || []).map((it: any, iIdx: number) => {
        const rawId = (it.item_id || it.id).toString();
        const itSlug = it.slug || rawId;
        const itTitle = typeof it.title === "object" ? it.title.rendered : (it.title || it.name || it.post_title || `Item #${rawId}`);
        return {
          id: rawId,
          slug: itSlug,
          title: decodeEntities(itTitle),
          type: it.item_type || it.type || (itTitle.toLowerCase().includes("quiz") || itTitle.toLowerCase().includes("review") ? "lp_quiz" : "lp_lesson"),
          duration: it.duration || (it.item_type === "lp_quiz" ? "1 minute" : `${(iIdx + 1) * 3 + 2} minutes`),
          questions_count: it.questions_count || (it.item_type === "lp_quiz" || itTitle.toLowerCase().includes("quiz") || itTitle.toLowerCase().includes("review") ? "2 questions" : ""),
        };
      }).filter((it: any) => !searchQuery.trim() || it.title.toLowerCase().includes(searchQuery.toLowerCase()));

      return {
        section_id: sec.section_id || `sec-${sIdx}`,
        title: sec.section_name || sec.title || `Section ${sIdx + 1}`,
        items,
      };
    });
  }, [sections, allCurriculumItems, searchQuery]);

  const toggleSection = (secId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  // Complete lesson API call & navigate to next item
  const handleConfirmComplete = async () => {
    setShowCompleteModal(false);
    setIsCompleting(true);
    const targetId = activeItem?.id || lessonId;
    try {
      const res = await fetch("/api/mark-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: targetId,
          user_id: user?.id,
        }),
      });

      if (res.ok) {
        const numId = Number(targetId);
        setCompletedList((prev) => Array.from(new Set([...prev, ...(isNaN(numId) ? [] : [numId])])));

        // Tự động chuyển sang bài học tiếp theo nếu có
        if (nextItem) {
          const nextSlug = nextItem.slug || nextItem.id;
          router.push(`/courses/${slug}/lessons/${nextSlug}`);
        }
      }
    } catch (e) {
      console.error("Mark complete failed:", e);
    } finally {
      setIsCompleting(false);
    }
  };

  const passingGrade = passingGradeState;
  const isEligibleToFinish = progressPercent >= passingGrade || isCourseFinished;

  // Finish Course API call
  const handleFinishCourse = async () => {
    if (!isEligibleToFinish && !isCourseFinished) {
      alert(`Bạn cần hoàn thành tối thiểu ${passingGrade}% để Finish Course. Tiến trình hiện tại: ${progressPercent}%`);
      return;
    }

    if (isCourseFinished) {
      setShowFinishModal(true);
      return;
    }

    setIsFinishingCourse(true);
    try {
      const res = await fetch("/api/finish-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          user_id: user?.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsCourseFinished(true);
        setShowFinishModal(true);
      } else {
        alert(data.message || "Không thể hoàn thành khóa học.");
      }
    } catch (e) {
      console.error("Finish course failed:", e);
    } finally {
      setIsFinishingCourse(false);
    }
  };

  // Handle comment submit
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentPosted(true);
    setCommentText("");
    setTimeout(() => setCommentPosted(false), 4000);
  };

  // Handle Quiz submission
  const sampleQuizQuestions = [
    {
      id: 1,
      question: "1. Practical Life activities are primarily designed to help children develop:",
      options: [
        "A. Independence, concentration, and coordination",
        "B. Advanced mathematical formulas",
        "C. Computer programming skills",
        "D. Foreign language fluency",
      ],
      correct: 0,
    },
    {
      id: 2,
      question: "2. Which of the following is an example of a Practical Life exercise?",
      options: [
        "A. Pouring water and buttoning clothes",
        "B. Solving quadratic equations",
        "C. Memorizing world capitals",
        "D. Analyzing classical poetry",
      ],
      correct: 0,
    },
  ];

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let score = 0;
    sampleQuizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correct) {
        score += 50;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    setCompletedList((prev) => Array.from(new Set([...prev, Number(lessonId)])));
  };

  return (
    <div className={styles.popup_wrapper}>
      {/* Body */}
      <div className={styles.popup_body}>
        {/* Sidebar */}
        <aside
          className={styles.popup_sidebar}
          style={{ transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", display: sidebarOpen ? "flex" : "none" }}
        >
          <div className={styles.sidebar_search}>
            <input
              type="text"
              placeholder="Search for course content"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={styles.sidebar_search_icon}>🔍</span>
          </div>

          <div className={styles.curriculum_container}>
            {filteredSections.map((sec) => {
              const isCollapsed = !!collapsedSections[sec.section_id];
              const secItems = sec.items || [];
              const secCompletedCount = secItems.filter((it: any) => completedList.includes(Number(it.id))).length;
              const secTotalCount = secItems.length || 1;
              const secPercent = Math.round((secCompletedCount / secTotalCount) * 100);

              return (
                <div key={sec.section_id} className={styles.section_block}>
                  <div className={styles.section_header} onClick={() => toggleSection(sec.section_id)}>
                    <div className="flex-1 min-w-0 pr-2">
                      <h5 className={styles.section_title_text}>{sec.title}</h5>
                    </div>
                    <span className={styles.section_caret}>{isCollapsed ? "▲" : "▼"}</span>
                    <div className={styles.section_progress_bar} title={`Section progress ${secPercent}%`}>
                      <div className={styles.section_progress_fill} style={{ width: `${secPercent}%` }} />
                    </div>
                  </div>

                  {!isCollapsed && (
                    <ul className={styles.section_items_list}>
                      {secItems.map((it: any) => {
                        const isActive = it.id === lessonId || it.slug === lessonId;
                        const isDone = completedList.includes(Number(it.id));
                        const isQuizType = it.type === "lp_quiz" || it.title.toLowerCase().includes("quiz") || it.title.toLowerCase().includes("review");
                        const itemUrlSlug = it.slug || it.id;

                        return (
                          <li key={it.id}>
                            <Link
                              href={`/courses/${slug}/lessons/${itemUrlSlug}`}
                              className={`${styles.item_row} ${isActive ? styles.item_row_active : ""}`}
                            >
                              <div className={styles.item_left}>
                                <span className={styles.item_icon}>{isQuizType ? "⏱️" : "📄"}</span>
                                <span className={styles.item_name}>{it.title}</span>
                              </div>

                              <div className={styles.item_meta_badges}>
                                {isQuizType && it.questions_count && (
                                  <span className={styles.badge_questions}>{it.questions_count}</span>
                                )}
                                {it.duration && <span className={styles.badge_duration}>{it.duration}</span>}
                                {isDone && <span className={styles.badge_completed} title="Passed / Completed">✓</span>}
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Content Area (Right Side) */}
        <main className={styles.popup_content}>
          {/* Header inside Main Area */}
          <header className={styles.popup_header}>
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <button
                className={styles.sidebar_toggle_btn}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title="Show/Hide curriculum"
              >
                {sidebarOpen ? "◄" : "►"}
              </button>
              <Link href={`/courses/${slug}`} className={styles.course_title} title={courseTitle}>
                {courseTitle}
              </Link>
            </div>

            <div className={styles.header_right}>
              <div className={styles.items_progress}>
                <span>
                  <strong className="text-white font-bold">{completedCount}</strong> of {totalItemsCount} items ({progressPercent}% / Passing: {passingGrade}%)
                </span>
                <div className={styles.progress_bar_outer} title={`Progress: ${progressPercent}% | Passing Grade: ${passingGrade}%`}>
                  <div className={styles.progress_bar_inner} style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {isEligibleToFinish && (
                <button
                  type="button"
                  onClick={handleFinishCourse}
                  disabled={isFinishingCourse}
                  className={`${styles.btn_finish_course} ${isCourseFinished ? styles.btn_course_finished_done : ""}`}
                  title={`Finish Course (Passing Grade: ${passingGrade}%)`}
                >
                  {isFinishingCourse ? "Finishing..." : isCourseFinished ? "✓ Course Finished" : "Finish Course"}
                </button>
              )}

              <Link href={`/courses/${slug}`} className={styles.close_button} title="Exit learning">
                ✕
              </Link>
            </div>
          </header>

          <div className={styles.content_scroll_area}>
            <div className={styles.content_inner}>
              {/* Success notification banner */}
              {isCurrentCompleted && (
                <div className={styles.completed_banner}>
                  <span>🔖</span> Congrats! You have completed &quot;{lessonTitle}&quot;.
                </div>
              )}

              <h1 className={styles.lesson_title}>{lessonTitle}</h1>

              {/* Lesson or Quiz Content */}
              {!canAccess ? (
                <div className="p-8 my-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center shadow-lg mb-10">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-3xl mx-auto mb-4">
                    🔒
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    This content is protected. Please enroll in the course to view this content!
                  </h3>
                  <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                    Nội dung này được bảo vệ. Vui lòng đăng ký tham gia khóa học để mở khóa toàn bộ nội dung bài giảng và bài kiểm tra.
                  </p>
                  <Link
                    href={`/courses/${slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                  >
                    <span>🚀</span> Tham gia khóa học ngay
                  </Link>
                </div>
              ) : isQuiz ? (
                <div className={styles.quiz_box}>
                  <h3 className={styles.quiz_title}>📋 {lessonTitle}</h3>
                  {quizSubmitted ? (
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 mb-6">
                      <h4 className="text-xl font-bold mb-2">🎉 Bài Quiz đã hoàn thành!</h4>
                      <p className="text-base font-semibold">Điểm số của bạn: <strong>{quizScore} / 100 điểm</strong></p>
                      <p className="text-sm mt-2 text-emerald-700">Chúc mừng bạn đã xuất sắc vượt qua bài kiểm tra này!</p>
                    </div>
                  ) : (
                    <form onSubmit={handleQuizSubmit}>
                      {sampleQuizQuestions.map((q) => (
                        <div key={q.id} className={styles.quiz_question_card}>
                          <div className={styles.quiz_question_title}>{q.question}</div>
                          {q.options.map((opt, oIdx) => (
                            <label key={oIdx} className={styles.quiz_option_label}>
                              <input
                                type="radio"
                                name={`question_${q.id}`}
                                checked={quizAnswers[q.id] === oIdx}
                                onChange={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                                required
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ))}
                      <button type="submit" className={styles.btn_complete} style={{ marginTop: "16px" }}>
                        🚀 Nộp bài Quiz
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className={styles.lesson_body_html}
                    dangerouslySetInnerHTML={{ __html: lessonContentHtml }}
                  />

                  {/* Complete & Finish Buttons */}
                  <div className="flex items-center gap-4 mb-10 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isCurrentCompleted && !isCompleting) {
                          setShowCompleteModal(true);
                        }
                      }}
                      disabled={isCompleting || isCurrentCompleted}
                      className={`${styles.btn_complete} ${isCurrentCompleted ? styles.btn_completed_done : ""}`}
                      style={{ marginBottom: 0 }}
                    >
                      {isCompleting ? "Processing..." : isCurrentCompleted ? "✓ Completed" : "Complete"}
                    </button>

                    {isEligibleToFinish && (
                      <button
                        type="button"
                        onClick={handleFinishCourse}
                        disabled={isFinishingCourse}
                        className={`${styles.btn_finish_course_content} ${isCourseFinished ? styles.btn_course_finished_done : ""}`}
                        style={{ marginLeft: 0 }}
                      >
                        {isFinishingCourse ? "Finishing..." : isCourseFinished ? "✓ Course Finished" : "Finish Course"}
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Comment Section ("Leave a Reply") */}
              <div className={styles.comments_section}>
                <h3 className={styles.comments_title}>Leave a Reply</h3>
                <p className={styles.logged_in_as}>
                  Logged in as <strong>{user?.username || "student"}</strong>. <Link href="/my-account/personal-info">Edit your profile</Link>. Required fields are marked <span className="text-red-500">*</span>
                </p>

                {commentPosted && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg mb-4 text-sm font-semibold">
                    ✅ Bình luận của bạn đã được đăng thành công!
                  </div>
                )}

                <form onSubmit={handleCommentSubmit}>
                  <textarea
                    className={styles.comment_textarea}
                    placeholder="Comment"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    required
                  />
                  <button type="submit" className={styles.btn_submit_comment}>
                    Post A Comment
                  </button>
                </form>
              </div>
            </div>

            {/* Footer Navigation */}
            <footer className={styles.popup_footer}>
              {prevItem ? (
                <Link
                  href={`/courses/${slug}/lessons/${prevItem.slug || prevItem.id}`}
                  className={styles.nav_btn}
                  title={prevItem.title}
                >
                  ◄ Prev ({prevItem.title})
                </Link>
              ) : (
                <span className={`${styles.nav_btn} ${styles.nav_btn_disabled}`}>◄ Prev</span>
              )}

              {nextItem ? (
                <Link
                  href={`/courses/${slug}/lessons/${nextItem.slug || nextItem.id}`}
                  className={styles.nav_btn}
                  title={nextItem.title}
                >
                  Next ({nextItem.title}) ►
                </Link>
              ) : (
                <span className={`${styles.nav_btn} ${styles.nav_btn_disabled}`}>Next ►</span>
              )}
            </footer>
          </div>
        </main>
      </div>

      {/* Complete Lesson Confirmation Modal */}
      {showCompleteModal && (
        <div className={styles.modal_backdrop} onClick={() => setShowCompleteModal(false)}>
          <div className={styles.modal_card} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modal_header}>
              <h3 className={styles.modal_title}>Complete lesson</h3>
            </div>
            <div className={styles.modal_body}>
              Do you want to complete the lesson &quot;{lessonTitle}&quot; ?
            </div>
            <div className={styles.modal_footer}>
              <button
                type="button"
                className={styles.btn_modal_no}
                onClick={() => setShowCompleteModal(false)}
              >
                No
              </button>
              <button
                type="button"
                className={styles.btn_modal_yes}
                onClick={handleConfirmComplete}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Course Congratulations Modal */}
      {showFinishModal && (
        <div className={styles.modal_backdrop} onClick={() => setShowFinishModal(false)}>
          <div className={styles.modal_card} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modal_header} style={{ background: "#10b981" }}>
              <h3 className={styles.modal_title}>🎉 Congratulations!</h3>
            </div>
            <div className={styles.modal_body}>
              <p className="text-base font-semibold text-slate-800 mb-2">
                Bạn đã hoàn thành xuất sắc khóa học <strong>{courseTitle}</strong>!
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tiến trình học tập của bạn đã đạt <strong>{progressPercent}%</strong> (Vượt điểm qua môn {passingGrade}%). Trạng thái hoàn thành khóa học đã được ghi nhận trực tiếp vào hệ thống WordPress LearnPress.
              </p>
            </div>
            <div className={styles.modal_footer}>
              <Link href={`/courses/${slug}`} className={styles.btn_modal_yes} style={{ textDecoration: "none" }}>
                Quay về trang khóa học
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
