"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./LearnPressPopup.module.css";
import { Search, FileText, ChevronDown, XCircle, HelpCircle, Check, ArrowLeft, ArrowRight, ChevronUp, LockKeyhole, Puzzle, Clock, BarChart2 } from "lucide-react";

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
  isUserPurchased?: boolean;
  isLockedByProgression?: boolean;
  previousLesson?: any;
  progress?: any;
  isQuizPage?: boolean;
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

const formatDurationText = (durationStr?: string) => {
  if (!durationStr) return "";
  return durationStr
    .replace(/\b0*(\d+)\s*minutes?\b/gi, (_, num) => (parseInt(num, 10) === 1 ? `${parseInt(num, 10)} minute` : `${parseInt(num, 10)} minutes`))
    .replace(/\b0*(\d+)\s*mins?\b/gi, (_, num) => (parseInt(num, 10) === 1 ? `${parseInt(num, 10)} minute` : `${parseInt(num, 10)} minutes`))
    .replace(/\b0*(\d+)\s*min\b/gi, (_, num) => (parseInt(num, 10) === 1 ? `${parseInt(num, 10)} minute` : `${parseInt(num, 10)} minutes`))
    .replace(/\b0*(\d+)\s*m\b/gi, (_, num) => (parseInt(num, 10) === 1 ? `${parseInt(num, 10)} minute` : `${parseInt(num, 10)} minutes`));
};

const formatMetaDuration = (durationStr?: string) => {
  if (
    !durationStr ||
    durationStr.trim() === "" ||
    durationStr === "0" ||
    durationStr === "00:00:00" ||
    durationStr === "00:00" ||
    durationStr === "0 minute" ||
    durationStr === "0 minutes" ||
    durationStr === "0 min" ||
    durationStr === "0 mins"
  ) {
    return "No Limit";
  }
  if (durationStr.includes(":") && durationStr.split(":").length === 3) {
    if (durationStr === "00:00:00") return "No Limit";
    return durationStr;
  }
  const match = durationStr.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num === 0) return "No Limit";
    const mins = num % 60;
    const hrs = Math.floor(num / 60);
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
  }
  return durationStr;
};

const extractQuestionsCount = (qCount?: any) => {
  if (typeof qCount === "number" && qCount > 0) return qCount.toString();
  if (qCount) {
    const match = String(qCount).match(/(\d+)/);
    if (match) return match[1];
  }
  return "";
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
  isUserPurchased = false,
  isQuizPage = false,
  progress,
}: LessonViewWrapperProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [completedList, setCompletedList] = useState<number[]>(completedLessons || []);
  const [failedQuizzesList, setFailedQuizzesList] = useState<number[]>(progress?.failed_quizzes || []);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isFinishingCourse, setIsFinishingCourse] = useState(false);
  const [isCourseFinished, setIsCourseFinished] = useState(
    course?.user_course_status === "finished" || course?.status === "finished"
  );
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentPosted, setCommentPosted] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, any>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [lastAttempt, setLastAttempt] = useState<any>(null);
  const [attemptsList, setAttemptsList] = useState<any[]>([]);
  const [loadingLastAttempt, setLoadingLastAttempt] = useState<boolean>(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(isQuizPage);
  const [showSubmitQuizModal, setShowSubmitQuizModal] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [showRepurchaseModal, setShowRepurchaseModal] = useState(false);
  const [isRepurchasing, setIsRepurchasing] = useState(false);

  const handleRepurchase = async (actionChoice: string) => {
    setIsRepurchasing(true);
    try {
      const res = await fetch("/api/repurchase-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: courseId || course?.id,
          action: actionChoice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRepurchaseModal(false);
        window.location.reload();
      } else {
        alert(data.message || "Lỗi khi thực hiện đăng ký học lại");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi khi kết nối máy chủ");
    } finally {
      setIsRepurchasing(false);
    }
  };

  useEffect(() => {
    if (quizStarted && !quizSubmitted) {
      const timer = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizStarted, quizSubmitted]);

  const [passingGradeState, setPassingGradeState] = useState<number>(
    Number(course?.passingGrade || course?._lp_passing_condition || 80)
  );

  useEffect(() => {
    if (completedLessons && Array.isArray(completedLessons)) {
      setCompletedList(completedLessons);
    }
  }, [completedLessons]);

  useEffect(() => {
    if (progress?.failed_quizzes && Array.isArray(progress.failed_quizzes)) {
      setFailedQuizzesList(progress.failed_quizzes);
    }
  }, [progress?.failed_quizzes]);

  useEffect(() => {
    if (user?.id && courseId) {
      const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL || "https://test4.questx.com.vn";
      fetch(`${wpUrl}/wp-json/custom/v1/course-progress?user_id=${user.id}&course_id=${courseId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (Array.isArray(data.completed_lessons) && data.completed_lessons.length > 0) {
              setCompletedList((prev) =>
                Array.from(new Set([...prev, ...data.completed_lessons.map((id: any) => Number(id))]))
              );
            }
            if (Array.isArray(data.failed_quizzes)) {
              setFailedQuizzesList((prev) =>
                Array.from(new Set([...prev, ...data.failed_quizzes.map((id: any) => Number(id))]))
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
            const itTitle = typeof it.title === "object" ? it.title.rendered : (it.title || it.name || it.post_title || `Lesson #${rawId}`);
            const cleanTitleSlug = itTitle ? itTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : rawId;
            const itSlug = (it.slug && !/^\d+$/.test(it.slug.toString())) ? it.slug : (cleanTitleSlug || rawId);
            const itContent = it.post_content || it.content || it.description || "";
            list.push({
              id: rawId,
              slug: itSlug,
              title: decodeEntities(itTitle),
              content: itContent,
              type: it.item_type || it.type || (itTitle.toLowerCase().includes("quiz") || itTitle.toLowerCase().includes("review") ? "lp_quiz" : "lp_lesson"),
              duration: it.duration || (it.item_type === "lp_quiz" ? "1 minute" : `${(iIdx + 1) * 3 + 2} minutes`),
              questions_count: it.questions_count || (it.item_type === "lp_quiz" || itTitle.toLowerCase().includes("quiz") || itTitle.toLowerCase().includes("review") ? "" : ""),
              passing_grade: it.passing_grade ?? it._lp_passing_grade ?? it.passingGrade ?? "",
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
        const lTitle = typeof l.title === "object" ? l.title.rendered : (l.title || l.name || l.post_title || `Lesson #${rawId}`);
        const cleanTitleSlug = lTitle ? lTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : rawId;
        const lSlug = (l.slug && !/^\d+$/.test(l.slug.toString())) ? l.slug : (cleanTitleSlug || rawId);
        const lContent = l.content || l.post_content || "";
        list.push({
          id: rawId,
          slug: lSlug,
          title: decodeEntities(lTitle),
          content: lContent,
          type: l.type || l.item_type || "lp_lesson",
          duration: `${(idx + 1) * 4} minutes`,
          questions_count: l.type === "lp_quiz" ? "" : "",
          section_id: "sec-0",
          section_title: "Curriculum",
        });
      });
    }

    return list;
  }, [sections, lessons]);

  // Active Item, Index, Prev and Next items
  const activeItem = allCurriculumItems.find((it) => {
    const cleanTitleSlug = it.title ? it.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : "";
    return it.id === lessonId || it.slug === lessonId || (cleanTitleSlug && cleanTitleSlug === lessonId);
  });


  const quizPassingGradeRaw =
    activeItem?.passing_grade ??
    activeLesson?.passing_grade ??
    activeLesson?._lp_passing_grade ??
    "";
  const quizPassingGradeDisplay =
    quizPassingGradeRaw !== "" && quizPassingGradeRaw != null
      ? String(quizPassingGradeRaw).replace(/%/g, "").trim()
      : "";





  const activeIndex = allCurriculumItems.findIndex((it) => {
    const cleanTitleSlug = it.title ? it.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : "";
    return it.id === lessonId || it.slug === lessonId || (cleanTitleSlug && cleanTitleSlug === lessonId);
  });
  const prevItem = activeIndex > 0 ? allCurriculumItems[activeIndex - 1] : null;
  const nextItem = activeIndex >= 0 && activeIndex < allCurriculumItems.length - 1 ? allCurriculumItems[activeIndex + 1] : null;

  // Calculate Progress
  const totalItemsCount = allCurriculumItems.length || 1;
  const activeId = activeItem?.id || lessonId;
  const isCurrentCompleted = completedList.includes(Number(activeId)) || completedList.includes(activeId as any);
  const completedCount = allCurriculumItems.filter((it) => completedList.includes(Number(it.id)) || completedList.includes(it.id as any)).length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalItemsCount) * 100));

  // Dynamic lesson ID for comment fetching
  const targetLessonId = activeItem?.id || lessonId;

  useEffect(() => {
    if (!targetLessonId) return;
    setLoadingComments(true);
    fetch(`/api/lesson-comments?lesson_id=${targetLessonId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.comments)) {
          setCommentsList(data.comments);
        } else {
          setCommentsList([]);
        }
      })
      .catch(() => {
        setCommentsList([]);
      })
      .finally(() => {
        setLoadingComments(false);
      });
  }, [targetLessonId]);

  const logQuizAttemptsNextJS = (attempts: any[], quizName?: string) => {
    if (!attempts || attempts.length === 0) return;
    const sorted = [...attempts].sort((a, b) => {
      const timeA = new Date(a.start_time || a.user_item_id || 0).getTime();
      const timeB = new Date(b.start_time || b.user_item_id || 0).getTime();
      return timeA - timeB;
    });

    console.group(`%c[Next.js LearnPress Quiz Attempts] ${quizName || ''}`, "background: #2563eb; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
    console.log("Tổng số lần làm bài (Total Attempts):", sorted.length);
    console.log("%c[Last Attempt / Lần làm mới nhất]:", "color: #ef4444; font-weight: bold; font-size: 13px;", sorted[sorted.length - 1]);
    sorted.forEach((att, idx) => {
      console.log(`%cLần thứ ${idx + 1} (Attempt ${idx + 1}):`, "color: #10b981; font-weight: bold;", {
        "Lần làm": `Lần thứ ${idx + 1}`,
        "ID lượt làm": att.user_item_id,
        "Kết quả": att.graduation || att.status,
        "Điểm số": att.result || `${att.result_num || 0}%`,
        "Số câu đúng": att.correct,
        "Số câu sai": att.wrong,
        "Số câu bỏ qua": att.skipped,
        "Điểm đạt": att.points || `${att.user_mark} / ${att.mark}`,
        "Thời gian": att.time_spent,
        "Thời gian bắt đầu": att.start_time,
        "Thời gian kết thúc": att.end_time,
        "Dữ liệu đầy đủ": att
      });
    });
    console.groupEnd();
  };

  // Helper restore answered values from attempt data for Review Mode
  const restoreQuizAnswersFromAttempt = (attempt: any, questions: any[]) => {
    if (!attempt || !questions || questions.length === 0) return {};
    const qMap: Record<number, any> = {};
    const attemptsQuestions = attempt.questionsData || attempt.results?.questions || attempt.data?.questions || attempt.questions || {};

    questions.forEach((q) => {
      const qId = q.id;
      const qData = attemptsQuestions[String(qId)] || attemptsQuestions[qId];
      if (!qData || qData.answered === undefined || qData.answered === null) return;

      const rawAns = qData.answered;
      const lpOptions = Array.isArray(qData.options) ? qData.options : [];

      if (lpOptions.length > 0) {
        const optionHashes = lpOptions.map((opt: any) => (typeof opt === "object" ? String(opt.value || opt.id || opt.title || "") : String(opt)));
        const optionTitles = lpOptions.map((opt: any) => (typeof opt === "object" ? String(opt.title || "") : String(opt)));

        const resolveIndex = (ansVal: any): number => {
          const valStr = String(ansVal);
          let idx = optionHashes.indexOf(valStr);
          if (idx !== -1) return idx;
          idx = optionTitles.indexOf(valStr);
          if (idx !== -1) return idx;
          const num = Number(ansVal);
          if (!isNaN(num) && num >= 0 && num < lpOptions.length) return num;
          return -1;
        };

        if (Array.isArray(rawAns)) {
          const indices = rawAns.map(resolveIndex).filter((i) => i !== -1);
          if (indices.length > 0) qMap[qId] = indices;
        } else {
          const idx = resolveIndex(rawAns);
          if (idx !== -1) qMap[qId] = idx;
        }
      } else if (q.optionValues && typeof q.optionValues === "object") {
        const hashKeys = Object.keys(q.optionValues);
        if (Array.isArray(rawAns)) {
          const indices = rawAns
            .map((h) => {
              const matchKey = hashKeys.find((k) => q.optionValues[k] === String(h));
              return matchKey !== undefined ? Number(matchKey) : -1;
            })
            .filter((idx) => idx !== -1);
          if (indices.length > 0) qMap[qId] = indices;
        } else {
          const matchKey = hashKeys.find((k) => q.optionValues[k] === String(rawAns));
          if (matchKey !== undefined) qMap[qId] = Number(matchKey);
        }
      } else {
        if (Array.isArray(rawAns)) {
          const nums = rawAns.map(Number).filter((n) => !isNaN(n));
          if (nums.length > 0) qMap[qId] = nums;
        } else if (!isNaN(Number(rawAns))) {
          qMap[qId] = Number(rawAns);
        }
      }
    });

    return qMap;
  };

  // Fetch Last Attempt from LearnPress DB — dùng /learnpress/v1/users/{id} (chính xác nhất)
  useEffect(() => {
    const numericQuizId = activeLesson?.id || activeItem?.id;
    const targetQuizId = numericQuizId ? numericQuizId.toString() : lessonId;

    const isQuizType = isQuizPage || activeLesson?.item_type === "lp_quiz" || activeLesson?.type === "lp_quiz" || activeItem?.type === "lp_quiz" || (activeItem?.title && (activeItem.title.toLowerCase().includes("quiz") || activeItem.title.toLowerCase().includes("review")));
    if (!targetQuizId || !isQuizType) {
      setLastAttempt(null);
      setAttemptsList([]);
      return;
    }

    setLoadingLastAttempt(true);

    // Call NextJS API route /api/user/quiz-attempts (queries DB directly via WP REST API)
    fetch(`/api/user/quiz-attempts?quiz_id=${encodeURIComponent(targetQuizId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;

        const passingGrade = Number(quizPassingGradeDisplay || passingGradeState || 80);

        // Map tất cả attempts từ API
        const attempts = (Array.isArray(data.attempts) ? data.attempts : [])
          .map((att: any, i: number) => {
            const resNum =
              att.result_num != null
                ? Number(att.result_num)
                : parseFloat(String(att.result || "0").replace("%", "")) || 0;

            const isPassed =
              att.status === "passed" ||
              att.graduation === "passed" ||
              resNum >= (passingGrade || 80);

            let qCount = Number(att.questions_count) || 0;
            if (qCount === 0 && quizQuestions?.length) qCount = quizQuestions.length;
            if (qCount === 0) qCount = 1;

            const totMark = att.mark != null && Number(att.mark) > 0 ? Number(att.mark) : qCount;
            let uMark = 0;
            if (att.user_mark != null) uMark = Number(att.user_mark);
            else if (resNum > 0) uMark = Math.round((resNum / 100) * totMark);
            else if (isPassed) uMark = totMark;

            const qCorrect = att.correct != null ? Number(att.correct) : uMark;

            return {
              user_item_id: att.user_item_id || `att-${i}`,
              status: att.status || "completed",
              graduation: isPassed ? "passed" : "failed",
              start_time: att.start_time,
              end_time: att.end_time,
              time_spent: att.time_spent || "00:00:00",
              questions_count: qCount,
              correct: qCorrect,
              wrong: att.wrong != null ? Number(att.wrong) : Math.max(0, totMark - qCorrect),
              skipped: att.skipped != null ? Number(att.skipped) : 0,
              points: att.points || `${uMark} / ${totMark}`,
              user_mark: uMark,
              mark: totMark,
              passing_grade: att.passing_grade || `${passingGrade || 80}%`,
              result: att.result || `${resNum.toFixed(2)}%`,
              result_num: resNum,
              questionsData: att.questionsData || att.results?.questions || {},
              questions: att.questions || `${uMark} / ${totMark}`,
            };
          })
          // CHỈ loại bỏ started / in-progress. Giữ cả những record completed dù score/time tạm thời = 0
          .filter((a: any) => a.status !== "started" && a.status !== "in-progress");

        const sorted = [...attempts].sort(
          (a: any, b: any) => Number(a.user_item_id) - Number(b.user_item_id)
        );

        // Current = lần mới nhất (ưu tiên data.last_attempt nếu có điểm, không thì lấy cuối sorted)
        let current: any = null;
        if (
          data.last_attempt &&
          (Number(data.last_attempt.result_num) > 0 ||
            Number(data.last_attempt.user_mark) > 0 ||
            data.last_attempt.status === "completed")
        ) {
          const att = data.last_attempt;
          const resNum =
            att.result_num != null
              ? Number(att.result_num)
              : parseFloat(String(att.result || "0").replace("%", "")) || 0;

          const isPassed =
            att.status === "passed" ||
            att.graduation === "passed" ||
            resNum >= (passingGrade || 80);

          let qCount = Number(att.questions_count) || 0;
          if (qCount === 0 && quizQuestions?.length) qCount = quizQuestions.length;
          if (qCount === 0) qCount = 1;

          const totMark = att.mark != null && Number(att.mark) > 0 ? Number(att.mark) : qCount;
          let uMark = 0;
          if (att.user_mark != null) uMark = Number(att.user_mark);
          else if (resNum > 0) uMark = Math.round((resNum / 100) * totMark);
          else if (isPassed) uMark = totMark;

          const qCorrect = att.correct != null ? Number(att.correct) : uMark;

          current = {
            user_item_id: att.user_item_id,
            status: att.status || "completed",
            graduation: att.graduation || (isPassed ? "passed" : "failed"),
            start_time: att.start_time,
            end_time: att.end_time,
            time_spent: att.time_spent || "00:00:00",
            questions_count: qCount,
            correct: qCorrect,
            wrong: att.wrong != null ? Number(att.wrong) : Math.max(0, totMark - qCorrect),
            skipped: att.skipped != null ? Number(att.skipped) : 0,
            points: att.points || `${uMark} / ${totMark}`,
            user_mark: uMark,
            mark: totMark,
            passing_grade: att.passing_grade || `${passingGrade || 80}%`,
            result: att.result || `${resNum.toFixed(2)}%`,
            result_num: resNum,
            questionsData: att.questionsData || att.results?.questions || {},
            questions: att.questions || `${uMark} / ${totMark}`,
          };
        }

        if (!current && sorted.length > 0) {
          current = sorted[sorted.length - 1];
        }

        setLastAttempt(current);

        // Bảng Last Attempt = tất cả lần TRƯỚC current (dùng slice giống logic sau submit)
        const previous = sorted.length > 1 ? sorted.slice(0, -1) : [];
        setAttemptsList(previous);

        if (sorted.length > 0 || current) {
          logQuizAttemptsNextJS(
            current ? [...previous, current] : sorted,
            activeItem?.title || activeLesson?.title?.rendered
          );
        }
      })
      .catch(() => {
        setLastAttempt(null);
        setAttemptsList([]);
      })
      .finally(() => setLoadingLastAttempt(false));
  }, [activeItem, lessonId, isQuizPage, activeLesson, quizQuestions, user?.id, quizPassingGradeDisplay, passingGradeState]);

  useEffect(() => {
    if (lastAttempt && quizQuestions && quizQuestions.length > 0) {
      const restored = restoreQuizAnswersFromAttempt(lastAttempt, quizQuestions);
      if (Object.keys(restored).length > 0) {
        setQuizAnswers((prev) => ({ ...restored, ...prev }));
      }
    }
  }, [lastAttempt, quizQuestions]);

  useEffect(() => {
    if (quizStarted && !quizSubmitted) {
      const rawDur = activeItem?.duration || activeLesson?.duration;
      if (rawDur && rawDur !== "0" && rawDur !== "00:00:00" && rawDur !== "" && !rawDur.toLowerCase().includes("no limit")) {
        const match = rawDur.match(/(\d+)/);
        if (match) {
          const mins = parseInt(match[1], 10);
          if (mins > 0 && timeLeft === null) {
            setTimeLeft(mins * 60);
          }
        }
      }
    }
  }, [quizStarted, quizSubmitted, activeItem, activeLesson, timeLeft]);

  useEffect(() => {
    if (quizStarted && !quizSubmitted && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizStarted, quizSubmitted, timeLeft]);

  const formatTimerSeconds = (seconds: number | null) => {
    if (seconds === null) return null;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    const isQuizType = isQuizPage || activeLesson?.item_type === "lp_quiz" || activeLesson?.type === "lp_quiz" || activeItem?.type === "lp_quiz" || (activeItem?.title && (activeItem.title.toLowerCase().includes("quiz") || activeItem.title.toLowerCase().includes("review")));
    if (isQuizType) {
      // Ưu tiên numeric ID của WP (activeLesson.id) để lấy đúng câu hỏi quiz
      const quizIdOrSlug = activeLesson?.id || activeItem?.id || lessonId;
      const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL || "https://test4.questx.com.vn";
      setLoadingQuestions(true);

      const fetchQuestions = async () => {
        try {
          const apiRes = await fetch(`/api/quiz-questions?quiz_id=${encodeURIComponent(quizIdOrSlug)}`);
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData && apiData.success && Array.isArray(apiData.questions) && apiData.questions.length > 0) {
              const formattedQuestions = apiData.questions.map((q: any) => ({
                ...q,
                options: Array.isArray(q.options)
                  ? q.options.map((opt: any) => decodeEntities(typeof opt === "object" ? (opt.title || opt.value || opt.label) : String(opt)))
                  : [],
              }));
              setQuizQuestions(formattedQuestions);
              setLoadingQuestions(false);
              return;
            }
          }
        } catch (e) {
          console.error("Error fetching quiz-questions API:", e);
        }

        try {
          const username = process.env.WORDPRESS_API_USERNAME || "admin";
          const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD || "STOw aRuE TZ5E 4r2g JnJj 4pwS";
          const headers: HeadersInit = { "Content-Type": "application/json" };
          if (username && password) {
            headers["Authorization"] = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
          }

          let res = await fetch(`${wpUrl}/wp-json/learnpress/v1/quiz/${quizIdOrSlug}`, { headers });
          if (!res.ok) {
            res = await fetch(`${wpUrl}/wp-json/wp/v2/lp_quiz/${quizIdOrSlug}?_embed=true`);
          }
          if (!res.ok) {
            res = await fetch(`${wpUrl}/wp-json/wp/v2/lp_quiz?slug=${quizIdOrSlug}&_embed=true`);
          }

          if (res.ok) {
            const data = await res.json();
            const quizObj = Array.isArray(data) ? data[0] : data;
            const qList = quizObj?.questions || quizObj?.questions_data;

            if (Array.isArray(qList) && qList.length > 0) {
              const formatted = qList.map((item: any, idx: number) => {
                const qTitle = typeof item.title === "object" ? item.title.rendered : (item.title || item.post_title || item.name || `Question ${idx + 1}`);

                let rawOptions: string[] = [];
                if (Array.isArray(item.options)) {
                  rawOptions = item.options.map((opt: any) =>
                    typeof opt === "object" ? (opt.title || opt.value || opt.label) : String(opt)
                  );
                }

                if (rawOptions.length === 0) {
                  rawOptions = [];
                }

                return {
                  id: item.id || idx + 1,
                  question: `${idx + 1}. ${decodeEntities(qTitle.replace(/^\d+[\.\s]*/, ''))}`,
                  options: rawOptions,
                  correct: item.correct !== undefined ? item.correct : 0,
                };
              });

              setQuizQuestions(formatted);
              setLoadingQuestions(false);
              return;
            }
          }
        } catch (e) {
          console.error("Error fetching lp_question from WP API:", e);
        }

        if (activeLesson?.questions && Array.isArray(activeLesson.questions) && activeLesson.questions.length > 0) {
          const formatted = activeLesson.questions.map((q: any, idx: number) => {
            const qTitle = typeof q.title === "object" ? q.title.rendered : (q.title || q.name || `Question ${idx + 1}`);
            return {
              id: q.id || idx + 1,
              question: `${idx + 1}. ${decodeEntities(qTitle.replace(/^\d+[\.\s]*/, ''))}`,
              options: Array.isArray(q.options) ? q.options.map((o: any) => typeof o === "object" ? (o.title || o.value) : String(o)) : ["True", "False"],
              correct: q.correct !== undefined ? q.correct : 0,
            };
          });
          setQuizQuestions(formatted);
          setLoadingQuestions(false);
          return;
        }

        setLoadingQuestions(false);
      };

      fetchQuestions();
    }
  }, [isQuizPage, activeLesson, lessonId, activeItem]);

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
        const itTitle = typeof it.title === "object" ? it.title.rendered : (it.title || it.name || it.post_title || `Item #${rawId}`);
        const cleanTitleSlug = itTitle ? itTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : rawId;
        const itSlug = (it.slug && !/^\d+$/.test(it.slug.toString())) ? it.slug : (cleanTitleSlug || rawId);
        return {
          id: rawId,
          slug: itSlug,
          title: decodeEntities(itTitle),
          type: it.item_type || it.type || (itTitle.toLowerCase().includes("quiz") || itTitle.toLowerCase().includes("review") ? "lp_quiz" : "lp_lesson"),
          duration: it.duration || (it.item_type === "lp_quiz" ? "1 minute" : `${(iIdx + 1) * 3 + 2} minutes`),
          questions_count: it.questions_count || (it.item_type === "lp_quiz" || itTitle.toLowerCase().includes("quiz") || itTitle.toLowerCase().includes("review") ? "2 questions" : ""),
          preview: it.preview,
          is_sample: it.is_sample,
          is_preview: it.is_preview,
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

        // Tự động chuyển sang bài học/quiz tiếp theo nếu có
        if (nextItem) {
          const nextSlug = nextItem.slug || nextItem.id;
          const isNextQuiz = nextItem.type === "lp_quiz" || (nextItem.title && (nextItem.title.toLowerCase().includes("quiz") || nextItem.title.toLowerCase().includes("review")));
          if (isNextQuiz) {
            router.push(`/courses/${slug}/quizzes/${nextSlug}`);
          } else {
            router.push(`/courses/${slug}/lessons/${nextSlug}`);
          }
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
      alert(`You need to complete a minimum of ${passingGrade}% to Finish Course. Current progress: ${progressPercent}%`);
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
        alert(data.message || "Could not finish the course.");
      }
    } catch (e) {
      console.error("Finish course failed:", e);
    } finally {
      setIsFinishingCourse(false);
    }
  };

  const [isRetakingQuiz, setIsRetakingQuiz] = useState(false);

  const handleConfirmRetake = async () => {
    setIsRetakingQuiz(true);
    const targetId = (activeLesson?.id || activeItem?.id || lessonId).toString();
    try {
      const numericCourseId = !isNaN(Number(courseId))
        ? Number(courseId)
        : !isNaN(Number(course?.id))
          ? Number(course?.id)
          : 0;

      const res = await fetch("/api/retake-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          quiz_id: Number(targetId),
          course_id: numericCourseId,
        }),
      });

      if (res.ok) {
        console.log("[NextJS] Retake sync successful.");
      }
    } catch (e) {
      console.error("Error syncing retake with WordPress:", e);
    } finally {
      setIsRetakingQuiz(false);
      setShowRetakeModal(false);

      // Reset toàn bộ state quiz
      setQuizStarted(true);
      setIsReviewing(false);
      setQuizSubmitted(false);
      setQuizAnswers({});
      setCurrentQuestionIndex(0);
      setTimeSpent(0);        // ← bắt buộc
      setTimeLeft(null);      // ← để useEffect set lại duration
      setQuizScore(null);
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const targetId = activeItem?.id || lessonId;
    const authorName = user?.username || user?.display_name || "Student";
    const userAvatar = user?.avatar_url || "https://secure.gravatar.com/avatar/?s=96&d=mm&r=g";

    try {
      const res = await fetch("/api/lesson-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: targetId,
          content: commentText.trim(),
          user_id: user?.id,
          author_name: authorName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.comment) {
        setCommentsList((prev) => [data.comment, ...prev]);
      } else {
        const fallbackComment = {
          id: Date.now(),
          author: authorName,
          avatar: userAvatar,
          date: new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true }),
          content: commentText.trim(),
          awaitingModeration: true,
        };
        setCommentsList((prev) => [fallbackComment, ...prev]);
      }
      setCommentPosted(true);
      setCommentText("");
      setTimeout(() => setCommentPosted(false), 4000);
    } catch (err) {
      console.error("Lỗi khi gửi comment:", err);
    }
  };

  // Quiz questions from WordPress API (lp_question / lp_quiz)
  const activeQuizQuestions = quizQuestions;

  // Helper evaluation for questions (Single choice vs Multi choice)
  const isQuestionCorrect = (q: any, ans: any) => {
    if (ans === undefined || ans === null) return false;
    const qType = q.type || q.question_type || "single_choice";
    if (qType === "multi_choice" || qType === "multiple_choice") {
      const userSelected: number[] = (Array.isArray(ans) ? ans : [ans]).map(Number).filter((n: any) => !isNaN(n)).sort();
      let correctArr: number[] = [];
      if (Array.isArray(q.correct)) {
        correctArr = q.correct.map(Number).filter((n: any) => !isNaN(n)).sort();
      } else if (typeof q.correct === "string") {
        correctArr = q.correct.split(/[,|]/).map((s: string) => Number(s.trim())).filter((n: any) => !isNaN(n)).sort();
      } else if (typeof q.correct === "number") {
        correctArr = [q.correct];
      }
      return userSelected.length > 0 && userSelected.length === correctArr.length && userSelected.every((val, index) => val === correctArr[index]);
    }
    // true_or_false / single_choice: so sánh theo index
    return Number(ans) === Number(q.correct);
  };

  const handleFinishQuizClick = async () => {
    setIsSubmittingQuiz(true);

    // Chốt thời gian + dừng timer ngay (tránh lệch khi await fetch)
    const finalTimeSpent = timeSpent;
    setQuizStarted(false);

    let score = 0;
    const questionsToEvaluate = activeQuizQuestions;
    const pointPerQuestion = 100 / (questionsToEvaluate.length || 1);
    questionsToEvaluate.forEach((q) => {
      if (isQuestionCorrect(q, quizAnswers[q.id])) {
        score += pointPerQuestion;
      }
    });
    const finalScore = Math.round(score);
    setQuizScore(finalScore);

    const targetId = (activeLesson?.id || activeItem?.id || lessonId).toString();
    const numId = Number(targetId);
    setCompletedList((prev) => Array.from(new Set([...prev, ...(isNaN(numId) ? [] : [numId])])));
    if (finalScore >= passingGrade) {
      setFailedQuizzesList((prev) => prev.filter((id) => id !== numId));
    } else {
      setFailedQuizzesList((prev) => Array.from(new Set([...prev, numId])));
    }

    const correctCount = activeQuizQuestions.filter((q) => isQuestionCorrect(q, quizAnswers[q.id])).length;
    const wrongCount = activeQuizQuestions.filter((q) => {
      const userAns = quizAnswers[q.id];
      const hasAnswered = userAns !== undefined && userAns !== null && userAns !== "" && (!Array.isArray(userAns) || userAns.length > 0);
      return hasAnswered && !isQuestionCorrect(q, userAns);
    }).length;
    const skippedCount = activeQuizQuestions.filter((q) => {
      const userAns = quizAnswers[q.id];
      return userAns === undefined || userAns === null || userAns === "" || (Array.isArray(userAns) && userAns.length === 0);
    }).length;
    const totalCount = activeQuizQuestions.length || 1;

    const newAttemptRecord = {
      user_item_id: Date.now(),
      status: "completed",
      graduation: finalScore >= passingGrade ? "passed" : "failed",
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      time_spent: formatTimerSeconds(finalTimeSpent) || "00:00:00", // ← đổi
      questions: totalCount,
      correct: correctCount,
      wrong: wrongCount,
      skipped: skippedCount,
      points: `${correctCount} / ${totalCount}`,
      user_mark: correctCount,
      mark: totalCount,
      passing_grade: `${passingGrade}%`,
      result: `${finalScore.toFixed(2)}%`,
      result_num: finalScore,
    };

    // setLastAttempt(newAttemptRecord);
    // setAttemptsList((prev) => {
    //   const updated = [...prev, newAttemptRecord];
    //   logQuizAttemptsNextJS(updated, activeItem?.title || activeLesson?.title?.rendered);
    //   return updated;
    // });

    try {
      const answersPayload: Record<string, string | string[]> = {};
      const questionsDetailPayload: Record<string, any> = {};

      activeQuizQuestions.forEach((q) => {
        const userAns = quizAnswers[q.id];
        const isCorrect = isQuestionCorrect(q, userAns);
        let ansVal: any = null;

        if (userAns !== undefined && userAns !== null) {
          const qType = (q.type || "").toLowerCase();

          if (qType === "true_or_false") {
            if (userAns === 0 || userAns === "0" || userAns === true || userAns === "true" || userAns === "True") {
              ansVal = "true";
            } else {
              ansVal = "false";
            }
          } else if (q.optionValues && typeof q.optionValues === "object") {
            if (Array.isArray(userAns)) {
              ansVal = (userAns as number[]).map((idx) => q.optionValues[idx]).filter(Boolean);
            } else {
              ansVal = q.optionValues[Number(userAns)] || String(userAns);
            }
          } else {
            ansVal = Array.isArray(userAns) ? userAns.map(String) : String(userAns);
          }
          answersPayload[String(q.id)] = ansVal;
        }

        questionsDetailPayload[String(q.id)] = {
          answered: ansVal,
          correct: isCorrect,
          mark: 1,
          user_mark: isCorrect ? 1 : 0,
        };
      });

      const targetIdNum = Number(activeLesson?.id || activeItem?.id || lessonId);
      const numericCourseId = Number(courseId || course?.id || 0);

      if (!targetIdNum || isNaN(targetIdNum)) {
        console.error("quiz_id không hợp lệ");
        setIsSubmittingQuiz(false);
        return;
      }

      const submitRes = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(user?.id),
          quiz_id: targetIdNum,
          course_id: numericCourseId,
          result: finalScore,
          correct: correctCount,
          wrong: wrongCount,
          skipped: skippedCount,
          user_mark: correctCount,
          total_mark: totalCount,
          time_spent: formatTimerSeconds(finalTimeSpent) || "00:00:00", // ← đổi
          time_spent_seconds: finalTimeSpent, // ← đổi
          graduation: finalScore >= passingGrade ? "passed" : "failed",
          answers: Object.keys(answersPayload).length > 0 ? answersPayload : {},
          questions_detail: questionsDetailPayload,
        }),
      });

      if (submitRes.ok) {
        const submitData = await submitRes.json();
        console.log("[NextJS] Quiz result submitted to WordPress:", submitData);

        try {
          await new Promise((r) => setTimeout(r, 300));
          const attemptsRes = await fetch(`/api/user/quiz-attempts?quiz_id=${encodeURIComponent(String(targetIdNum))}`, { cache: "no-store" });
          if (attemptsRes.ok) {
            const attemptsData = await attemptsRes.json();
            const rawAttempts: any[] = attemptsData?.attempts ?? [];

            if (rawAttempts.length > 0) {
              const attempts = rawAttempts
                .map((att: any, i: number) => {
                  const resNum = Number(att.result_num ?? att.result ?? 0);
                  const isPassed =
                    att.status === "passed" ||
                    att.graduation === "passed" ||
                    resNum >= passingGrade;
                  const totMark = Number(att.mark ?? att.total_mark ?? totalCount) || totalCount;
                  const uMark = Number(att.user_mark ?? att.score ?? 0);
                  const timeStr = att.time_spent || att.time_spend || "00:00:00";

                  return {
                    user_item_id: att.user_item_id || `att-${i}`,
                    questions: att.questions || `${uMark} / ${totMark}`,
                    time_spent: timeStr,
                    points: att.points || `${uMark} / ${totMark}`,
                    passing_grade: att.passing_grade || `${passingGrade}%`,
                    result: att.result || `${resNum.toFixed(2)}%`,
                    result_num: resNum,
                    graduation: isPassed ? "passed" : "failed",
                  };
                })
                .filter((a: any) => a.status !== "started" && a.status !== "in-progress");

              const sorted = [...attempts].sort(
                (a, b) => Number(a.user_item_id) - Number(b.user_item_id)
              );

              // Kết quả chính = lần mới nhất
              const current = sorted[sorted.length - 1] || null;
              setLastAttempt(current);

              // Bảng Last Attempt = chỉ các lần trước đó
              const previous = sorted.length > 1 ? sorted.slice(0, -1) : [];
              setAttemptsList(previous);

              logQuizAttemptsNextJS(
                sorted,
                activeItem?.title || activeLesson?.title?.rendered
              );
            }
          }
        } catch (syncErr) {
          console.warn("[NextJS] Could not sync attempts from WP:", syncErr);
        }
      } else {
        console.warn("[NextJS] submit-quiz returned error:", await submitRes.text());
      }

    } catch (e) {
      console.error("Lỗi khi đồng bộ kết quả Quiz sang WordPress:", e);
    } finally {
      setIsSubmittingQuiz(false);
      setQuizSubmitted(true);
      setQuizStarted(false);
    }
  };


  // Helper calculations for Quiz Result Card
  const currentCalculatedScore = Math.round(
    ((activeQuizQuestions.filter((q) => isQuestionCorrect(q, quizAnswers[q.id])).length) / (activeQuizQuestions.length || 1)) * 100
  );

  const displayQuizScore = quizSubmitted
    ? (quizScore !== null && !isNaN(Number(quizScore)) ? Number(quizScore) : currentCalculatedScore)
    : (lastAttempt ? Math.round(parseFloat(String(lastAttempt.result_num !== undefined ? lastAttempt.result_num : (lastAttempt.result || 0)))) : 0);

  const isQuizPassed = quizSubmitted
    ? displayQuizScore >= passingGrade
    : (lastAttempt ? (lastAttempt.graduation === "passed" || displayQuizScore >= passingGrade) : false);

  const displayTimeSpent = quizSubmitted
    ? (formatTimerSeconds(timeSpent) || "00:00:00")
    : (lastAttempt?.time_spent || "00:00:00");

  const displayPoints = quizSubmitted
    ? `${activeQuizQuestions.filter((q) => isQuestionCorrect(q, quizAnswers[q.id])).length} / ${activeQuizQuestions.length || 1}`
    : (lastAttempt?.points || `${lastAttempt?.correct || 0} / ${lastAttempt?.questions_count || lastAttempt?.questions || activeQuizQuestions.length || 0}`);

  const displayQuestionsCount = quizSubmitted
    ? (activeQuizQuestions.length || 1)
    : (lastAttempt?.questions_count || lastAttempt?.questions || activeQuizQuestions.length || 0);

  const displayCorrectCount = quizSubmitted
    ? activeQuizQuestions.filter((q) => isQuestionCorrect(q, quizAnswers[q.id])).length
    : (lastAttempt?.correct !== undefined && !isNaN(Number(lastAttempt.correct)) ? Number(lastAttempt.correct) : 0);

  const displayWrongCount = quizSubmitted
    ? activeQuizQuestions.filter((q) => {
      const userAns = quizAnswers[q.id];
      const hasAnswered = userAns !== undefined && userAns !== null && userAns !== "" && (!Array.isArray(userAns) || userAns.length > 0);
      return hasAnswered && !isQuestionCorrect(q, userAns);
    }).length
    : (lastAttempt?.wrong !== undefined && !isNaN(Number(lastAttempt.wrong)) ? Number(lastAttempt.wrong) : 0);

  const rawSkipped = quizSubmitted
    ? activeQuizQuestions.filter((q) => {
      const userAns = quizAnswers[q.id];
      return userAns === undefined || userAns === null || userAns === "" || (Array.isArray(userAns) && userAns.length === 0);
    }).length
    : (lastAttempt?.skipped !== undefined && !isNaN(Number(lastAttempt.skipped))
      ? Number(lastAttempt.skipped)
      : Math.max(0, Number(displayQuestionsCount || 0) - Number(displayCorrectCount || 0) - Number(displayWrongCount || 0)));

  const displaySkippedCount = isNaN(Number(rawSkipped)) ? 0 : Number(rawSkipped);

  return (
    <div className={styles.popup_wrapper}>
      {/* Body */}
      <div className={styles.popup_body}>
        {/* Sidebar */}
        <aside
          className={`${styles.popup_sidebar} ${!sidebarOpen ? styles.sidebar_collapsed : ""}`}
        >
          <button
            className={styles.sidebar_toggle_btn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Hide curriculum" : "Show curriculum"}
          >
            {sidebarOpen ? "◄" : "►"}
          </button>
          <div className={styles.sidebar_search}>
            <input
              type="text"
              placeholder="Search for course content"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={styles.sidebar_search_icon}><Search /></span>
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
                    <div className={styles.section_title_wrap}>
                      <h5 className={styles.section_title_text}>{sec.title}</h5>
                    </div>
                    <span className={`${styles.section_caret} ${!isCollapsed ? styles.section_caret_expanded : ""}`}>
                      <ChevronDown size={16} />
                    </span>
                    <div className={styles.section_progress_bar} title={`Section progress ${secPercent}%`}>
                      <div className={styles.section_progress_fill} style={{ width: `${secPercent}%` }} />
                    </div>
                  </div>

                  <div className={`${styles.section_content_wrapper} ${!isCollapsed ? styles.expanded : ""}`}>
                    <div className={styles.section_content_inner}>
                      <ul className={styles.section_items_list}>
                        {secItems.map((it: any) => {
                          const isActive = it.id === lessonId || it.slug === lessonId;
                          const isDone = completedList.includes(Number(it.id));
                          const isQuizType = it.type === "lp_quiz" || it.title.toLowerCase().includes("quiz") || it.title.toLowerCase().includes("review");
                          const cleanTitleSlug = it.title ? it.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : it.id;
                          const itemUrlSlug = (it.slug && !/^\d+$/.test(it.slug.toString())) ? it.slug : (cleanTitleSlug || it.id);

                          const isItemPreview =
                            it.preview === true ||
                            it.preview === "yes" ||
                            it.preview === "1" ||
                            it.is_sample === true ||
                            it.is_preview === true ||
                            it.is_preview === "1";

                          const isItemLocked = !isUserPurchased && !isItemPreview;

                          const itemHref = isQuizType
                            ? `/courses/${slug}/quizzes/${itemUrlSlug}`
                            : `/courses/${slug}/lessons/${itemUrlSlug}`;

                          return (
                            <li key={it.id}>
                              <Link
                                href={isItemLocked ? "#" : itemHref}
                                onClick={(e) => {
                                  if (isItemLocked) {
                                    e.preventDefault();
                                    alert("Please enroll in this course to access this item.");
                                  }
                                }}
                                className={`${styles.item_row} ${isActive ? styles.item_row_active : ""} ${isItemLocked ? styles.item_row_locked : ""}`}
                                title={isItemLocked ? "Locked - Enrollment required" : undefined}
                              >
                                <div className={styles.item_left}>
                                  <span className={styles.item_icon}>{isQuizType ? <HelpCircle size={16} /> : <FileText size={16} />}</span>
                                  <span className={styles.item_name}>{it.title}</span>
                                </div>

                                <div className={styles.item_meta_badges}>
                                  {isQuizType && (
                                    <span className={styles.badge_questions}>
                                      {(() => {
                                        const isCurrent = (it.id === activeItem?.id || it.slug === activeItem?.slug || it.id === activeLesson?.id || it.slug === activeLesson?.slug);
                                        if (isCurrent && !loadingQuestions) {
                                          const cnt = activeQuizQuestions.length;
                                          return `${cnt} ${cnt === 1 ? "question" : "questions"}`;
                                        }
                                        if (it.questions_count !== undefined && it.questions_count !== null && it.questions_count !== "") {
                                          const raw = String(it.questions_count).trim();
                                          if (raw.toLowerCase().includes("question")) {
                                            return raw;
                                          }
                                          const match = raw.match(/(\d+)/);
                                          if (match) {
                                            const num = parseInt(match[1], 10);
                                            return `${num} ${num === 1 ? "question" : "questions"}`;
                                          }
                                        }
                                        if (activeQuizQuestions.length > 0 && isCurrent) {
                                          return `${activeQuizQuestions.length} ${activeQuizQuestions.length === 1 ? "question" : "questions"}`;
                                        }
                                        return "0 questions";
                                      })()}
                                    </span>
                                  )}
                                  {it.duration && <span className={styles.badge_duration}>{formatDurationText(it.duration)}</span>}
                                  {isItemLocked ? (
                                    <span className={styles.badge_locked} title="Locked - Please enroll">
                                      <LockKeyhole size={14} />
                                    </span>
                                  ) : (
                                    (() => {
                                      const isFailedQuiz = isQuizType && failedQuizzesList.includes(Number(it.id));
                                      return (
                                        <span
                                          className={`${styles.badge_completed} ${!isDone ? styles.badge_uncompleted : ""} ${isFailedQuiz ? styles.badge_failed : ""}`}
                                          title={isDone ? (isFailedQuiz ? "Failed" : "Passed / Completed") : "Not completed"}
                                        >
                                          {isFailedQuiz ? <XCircle size={16} /> : <Check size={16} />}
                                        </span>
                                      );
                                    })()
                                  )}
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Content Area (Right Side) */}
        <main className={styles.popup_content}>
          {/* Header inside Main Area */}
          <header className={styles.popup_header}>
            <div className={styles.header_left_title}>

              <Link href={`/courses/${slug}`} className={styles.course_title} title={courseTitle}>
                {courseTitle}
              </Link>
            </div>

            <div className={styles.header_right}>
              <div className={styles.items_progress}>
                <span>
                  <strong className={styles.highlight_count}>{completedCount}</strong> of {totalItemsCount} items ({progressPercent}% / Passing: {passingGrade}%)
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
            <div className={styles.content_inner} style={{ position: 'relative' }}>
              {isSubmittingQuiz && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  flexDirection: 'column',
                  borderRadius: '16px',
                  minHeight: '400px',
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid #f59e0b',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                  <p style={{ marginTop: '16px', fontWeight: 600, color: '#1e293b' }}>
                    Đang chấm điểm & đồng bộ kết quả lên hệ thống...
                  </p>
                </div>
              )}
              {/* Success notification banner */}
              {isCurrentCompleted && !progress?.is_blocked && (
                <div className={styles.completed_banner}>
                  <span>🔖</span> Congrats! You have completed &quot;{lessonTitle}&quot;.
                </div>
              )}

              {!progress?.is_blocked && <h1 className={styles.lesson_title}>{lessonTitle}</h1>}

              {/* Lesson or Quiz Content */}
              {progress?.is_blocked ? (
                <div className={styles.lock_banner}>
                  <div className={styles.lock_icon_circle}>
                    🔒
                  </div>
                  <h3 className={styles.lock_banner_title}>
                    {progress.block_reason === "duration_expired"
                      ? "Course Duration Expired (Khóa học đã kết thúc thời hạn)"
                      : "Course Blocked After Completion (Khóa học đã bị khóa sau khi hoàn thành)"}
                  </h3>
                  <p className={styles.lock_banner_desc}>
                    {progress.block_reason === "duration_expired"
                      ? `Thời lượng học cho khóa học này (${progress.duration_str || "theo quy định"}) đã hết hạn vào ${progress.expiration_time || "ngày kết thúc"}. Các bài học hiện tại đã bị đóng.`
                      : "Bạn đã hoàn thành khóa học này. Hệ thống được thiết lập tự động khóa bài học sau khi học viên hoàn thành."}
                  </p>

                  {progress.allow_repurchase === "yes" ? (
                    <button
                      type="button"
                      disabled={isRepurchasing}
                      onClick={() => {
                        if (progress.repurchase_option === "popup") {
                          setShowRepurchaseModal(true);
                        } else {
                          handleRepurchase(progress.repurchase_option || "reset");
                        }
                      }}
                      className={styles.btn_enroll_banner}
                    >
                      <span>🛒</span> {isRepurchasing ? "Đang xử lý..." : "Đăng ký học lại (Repurchase Course)"}
                    </button>
                  ) : (
                    <div className="text-xs text-slate-400 mt-3 italic">
                      Khóa học này hiện không cho phép đăng ký học lại.
                    </div>
                  )}
                </div>
              ) : !canAccess ? (
                <div className={styles.lock_banner}>
                  <div className={styles.lock_icon_circle}>
                    🔒
                  </div>
                  <h3 className={styles.lock_banner_title}>
                    This content is protected. Please enroll in the course to view this content!
                  </h3>
                  <p className={styles.lock_banner_desc}>
                    This content is protected. Please enroll in the course to unlock full access to lessons and quizzes.
                  </p>
                  <Link
                    href={`/courses/${slug}`}
                    className={styles.btn_enroll_banner}
                  >
                    <span>🚀</span> Enroll in course now
                  </Link>
                </div>
              ) : isQuizPage || isQuiz ? (
                <>
                  {!quizStarted ? (
                    (isCurrentCompleted || quizSubmitted || !!lastAttempt) ? (
                      <div className={styles.quiz_result_card}>
                        {/* Circular Gauge */}
                        <div className={styles.quiz_gauge_container}>
                          <svg className={styles.quiz_gauge_svg} viewBox="0 0 160 160">
                            <circle
                              cx={80}
                              cy={80}
                              r={68}
                              className={styles.quiz_gauge_bg}
                              strokeWidth={12}
                              fill="transparent"
                            />
                            <circle
                              cx={80}
                              cy={80}
                              r={68}
                              className={styles.quiz_gauge_fill}
                              strokeWidth={12}
                              strokeDasharray={2 * Math.PI * 68}
                              strokeDashoffset={(2 * Math.PI * 68) - ((displayQuizScore / 100) * (2 * Math.PI * 68))}
                              strokeLinecap="round"
                              fill="transparent"
                            />
                          </svg>

                          <div className={styles.quiz_score_center}>
                            <span className={styles.quiz_score_percent}>
                              {displayQuizScore}%
                            </span>
                            <div className={styles.quiz_score_divider} />
                            <span className={styles.quiz_score_passing}>
                              {passingGrade}%
                            </span>
                          </div>
                        </div>

                        {/* Status Pill Badge */}
                        <div className={styles.quiz_status_icon_wrap}>
                          <div
                            className={`${styles.quiz_status_badge} ${isQuizPassed ? styles.quiz_status_badge_passed : styles.quiz_status_badge_failed
                              }`}
                          >
                            {isQuizPassed ? (
                              <>
                                <span>Passed</span>
                                <span className={styles.quiz_status_icon}>✓</span>
                              </>
                            ) : (
                              <>
                                <span>Failed</span>
                                <span className={styles.quiz_status_icon}>✕</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Stats Table List */}
                        <div className={styles.quiz_stats_list}>
                          <div className={styles.quiz_stat_item}>
                            <span>Time spent</span>
                            <span className={styles.quiz_stat_value}>
                              {displayTimeSpent}
                            </span>
                          </div>
                          <div className={styles.quiz_stat_item}>
                            <span>Points</span>
                            <span className={styles.quiz_stat_value}>
                              {displayPoints}
                            </span>
                          </div>
                          <div className={styles.quiz_stat_item}>
                            <span>Questions</span>
                            <span className={styles.quiz_stat_value}>{displayQuestionsCount}</span>
                          </div>
                          <div className={styles.quiz_stat_item}>
                            <span>Correct</span>
                            <span className={styles.quiz_stat_value}>{displayCorrectCount}</span>
                          </div>
                          <div className={styles.quiz_stat_item}>
                            <span>Wrong</span>
                            <span className={styles.quiz_stat_value}>{displayWrongCount}</span>
                          </div>
                          <div className={styles.quiz_stat_item}>
                            <span>Skipped</span>
                            <span className={styles.quiz_stat_value}>{displaySkippedCount}</span>
                          </div>
                          <div className={styles.quiz_stat_item}>
                            <span>Minus points</span>
                            <span className={styles.quiz_stat_value}>0</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className={styles.quiz_actions_wrap}>
                          <button
                            type="button"
                            onClick={() => setShowRetakeModal(true)}
                            className={styles.btn_quiz_action}
                          >
                            Retake
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQuizStarted(true);
                              setIsReviewing(true);
                              setCurrentQuestionIndex(0);
                              if (lastAttempt) {
                                const restored = restoreQuizAnswersFromAttempt(lastAttempt, activeQuizQuestions);
                                if (Object.keys(restored).length > 0) {
                                  setQuizAnswers((prev) => ({ ...restored, ...prev }));
                                }
                              }
                            }}
                            className={styles.btn_quiz_action}
                          >
                            Review
                          </button>
                        </div>

                        {/* Attempts History Table ("Last Attempt" section) */}
                        {attemptsList.length > 0 && (
                          <div className={styles.quiz_attempts_wrapper}>
                            <h3 className={styles.quiz_attempts_title}>
                              Last Attempt
                            </h3>
                            <div className={styles.quiz_attempts_table_wrap}>
                              <table className={styles.quiz_attempts_table}>
                                <thead className={styles.quiz_attempts_thead}>
                                  <tr>
                                    <th className={styles.quiz_attempts_th}>Questions</th>
                                    <th className={styles.quiz_attempts_th}>Time spent</th>
                                    <th className={styles.quiz_attempts_th}>Marks</th>
                                    <th className={styles.quiz_attempts_th}>Passing grade</th>
                                    <th className={styles.quiz_attempts_th_right}>Result</th>
                                  </tr>
                                </thead>
                                <tbody className={styles.quiz_attempts_tbody}>
                                  {attemptsList.map((att: any, index: number) => (
                                    <tr key={att.user_item_id || index}>
                                      <td className={styles.quiz_attempts_td_main}>
                                        {att.questions || ""}
                                      </td>
                                      <td className={styles.quiz_attempts_td_mono}>
                                        {att.time_spent || ""}
                                      </td>
                                      <td className={styles.quiz_attempts_td}>
                                        {att.points || ""}
                                      </td>
                                      <td className={styles.quiz_attempts_td}>
                                        {att.passing_grade || "80%"}
                                      </td>
                                      <td className={parseFloat(att.result || att.result_num || "0") >= 80 ? styles.quiz_attempts_result_passed : styles.quiz_attempts_result_failed}>
                                        {att.result || `${att.result_num || 0}%`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div
                          className={styles.lesson_body_html}
                          dangerouslySetInnerHTML={{ __html: lessonContentHtml }}
                        />

                        {/* Loading questions state */}
                        {(isQuizPage || isQuiz) && loadingQuestions ? (
                          <div className={styles.no_questions_box}>
                            Loading quiz questions...
                          </div>
                        ) : (isQuizPage || isQuiz) && activeQuizQuestions.length === 0 ? (
                          <div className={styles.no_questions_box}>
                            You haven&apos;t any question!
                          </div>
                        ) : (
                          /* Quiz Meta Information Card (Matching EduBlink / LearnPress Quiz detail design) */
                          <div className={styles.quiz_overview_card}>
                            <div className={styles.quiz_overview_meta}>
                              {/* Questions count */}






                              <div className={styles.quiz_overview_meta_item}>
                                <Puzzle className={styles.quiz_meta_icon} />
                                <span>
                                  <strong>Questions:</strong> {activeQuizQuestions.length}
                                </span>
                              </div>

                              {/* Duration */}
                              <div className={styles.quiz_overview_meta_item}>
                                <Clock className={styles.quiz_meta_icon} />
                                <span>
                                  <strong>Duration:</strong> {formatMetaDuration(activeItem?.duration || activeLesson?.duration)}
                                </span>
                              </div>




                              {/* Passing Grade */}
                              <div className={styles.quiz_overview_meta_item}>
                                <BarChart2 className={styles.quiz_meta_icon} />
                                <span>
                                  <strong>Passing grade:</strong> {quizPassingGradeDisplay}%
                                </span>
                              </div>
                            </div>

                            {/* Start Button */}
                            <div className={styles.quiz_start_btn_wrap}>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuizStarted(true);
                                  setIsReviewing(false);
                                  setCurrentQuestionIndex(0);
                                  setQuizSubmitted(false);
                                }}
                                className={styles.btn_start_quiz}
                              >
                                Start
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  ) : (
                    <div className={styles.active_quiz_wrapper}>
                      {/* Yellow/Gold Header Bar */}
                      <div className={`${styles.active_quiz_header} ${isReviewing ? styles.active_quiz_header_review : ""}`}>
                        <div className={styles.active_quiz_header_title}>
                          {isReviewing && (
                            <span className={styles.badge_review_mode}>
                              Review Mode
                            </span>
                          )}
                          <span>Question <strong>{Math.min(currentQuestionIndex + 1, activeQuizQuestions.length)}</strong> of {activeQuizQuestions.length}</span>
                        </div>

                        <div className={styles.active_quiz_timer_actions}>
                          {!isReviewing && timeLeft !== null && (
                            <div className={styles.active_quiz_timer}>
                              <Clock size={18} />
                              <span>{formatTimerSeconds(timeLeft)}</span>
                            </div>
                          )}
                          {isReviewing ? (
                            <button
                              type="button"
                              onClick={() => {
                                setQuizStarted(false);
                                setIsReviewing(false);
                              }}
                              className={styles.btn_exit_review}
                            >
                              Exit Review
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowSubmitQuizModal(true)}
                              className={styles.btn_finish_quiz}
                            >
                              FINISH QUIZ
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Current Question Box */}
                      <div className={styles.active_quiz_body}>
                        {(() => {
                          const currentQ = activeQuizQuestions[Math.min(currentQuestionIndex, activeQuizQuestions.length - 1)];
                          const qId = currentQ?.id;
                          const qType = currentQ?.type || currentQ?.question_type || "single_choice";
                          const isMultiChoice = qType === "multi_choice" || qType === "multiple_choice";
                          const isTrueFalse = qType === "true_or_false" || qType === "true_false";

                          const userAns = quizAnswers[qId];
                          const isCorrect = isQuestionCorrect(currentQ, userAns);

                          // Determine correct answer array for options
                          let correctIndices: number[] = [];
                          if (Array.isArray(currentQ?.correct)) {
                            correctIndices = currentQ.correct.map(Number);
                          } else if (currentQ?.correct !== undefined && currentQ?.correct !== null) {
                            correctIndices = [Number(currentQ.correct)];
                          }

                          return (
                            <>
                              <div className={styles.active_quiz_question_bar}>
                                <span className={
                                  isMultiChoice ? styles.badge_q_type_multi : isTrueFalse ? styles.badge_q_type_tf : styles.badge_q_type_single
                                }>
                                  {isMultiChoice ? "Multi Choice (Select multiple answers)" : isTrueFalse ? "True / False" : "Single Choice"}
                                </span>

                                {isReviewing && (
                                  <span className={
                                    userAns === undefined
                                      ? styles.badge_review_skipped
                                      : isCorrect
                                        ? styles.badge_review_correct
                                        : styles.badge_review_incorrect
                                  }>
                                    {userAns === undefined ? (
                                      "Skipped"
                                    ) : isCorrect ? (
                                      <>✓ Correct</>
                                    ) : (
                                      <>✕ Incorrect</>
                                    )}
                                  </span>
                                )}
                              </div>

                              <h3 className={styles.question_text}>
                                {currentQ?.question}
                              </h3>

                              <div className={styles.options_list}>
                                {currentQ?.options?.map((opt: string, oIdx: number) => {
                                  const currentAns = quizAnswers[qId];
                                  const selectedArr: number[] = Array.isArray(currentAns)
                                    ? currentAns
                                    : (currentAns !== undefined ? [currentAns] : []);
                                  const isSelected = isMultiChoice
                                    ? selectedArr.includes(oIdx)
                                    : currentAns === oIdx;

                                  const isOptionCorrect = correctIndices.includes(oIdx);

                                  const handleToggleOption = () => {
                                    if (isReviewing) return; // Disable clicking options in Review mode

                                    if (isMultiChoice) {
                                      setQuizAnswers((prev) => {
                                        const prevArr: number[] = Array.isArray(prev[qId])
                                          ? prev[qId]
                                          : (prev[qId] !== undefined ? [prev[qId]] : []);
                                        const nextArr = prevArr.includes(oIdx)
                                          ? prevArr.filter((i) => i !== oIdx)
                                          : [...prevArr, oIdx];
                                        return { ...prev, [qId]: nextArr };
                                      });
                                    } else {
                                      setQuizAnswers((prev) => ({ ...prev, [qId]: oIdx }));
                                    }
                                  };

                                  // Review mode styling
                                  let optionCardStyle = isReviewing ? "" : styles.option_card_clickable;
                                  let badgeStyle = "";

                                  if (isReviewing) {
                                    if (isSelected && isOptionCorrect) {
                                      optionCardStyle = styles.option_card_review_correct_sel;
                                      badgeStyle = styles.option_badge_review_correct_sel;
                                    } else if (isSelected && !isOptionCorrect) {
                                      optionCardStyle = styles.option_card_review_incorrect_sel;
                                      badgeStyle = styles.option_badge_review_incorrect_sel;
                                    } else if (!isSelected && isOptionCorrect) {
                                      optionCardStyle = styles.option_card_review_correct_unsel;
                                      badgeStyle = styles.option_badge_review_correct_unsel;
                                    } else {
                                      optionCardStyle = styles.option_card_review_dimmed;
                                      badgeStyle = "";
                                    }
                                  } else if (isSelected) {
                                    optionCardStyle = styles.option_card_selected;
                                    badgeStyle = styles.option_badge_selected;
                                  }

                                  return (
                                    <label
                                      key={oIdx}
                                      onClick={handleToggleOption}
                                      className={`${styles.option_card} ${optionCardStyle}`}
                                    >
                                      <div className={styles.option_inner}>
                                        <div
                                          className={`${styles.option_badge} ${isMultiChoice ? styles.option_badge_multi : styles.option_badge_single} ${badgeStyle}`}
                                        >
                                          {isReviewing ? (
                                            isSelected ? (
                                              isOptionCorrect ? (
                                                <Check size={14} style={{ color: "#ffffff", fontWeight: "bold" }} />
                                              ) : (
                                                <span style={{ color: "#ffffff", fontSize: "12px", fontWeight: "bold" }}>✕</span>
                                              )
                                            ) : isOptionCorrect ? (
                                              <div className={styles.radio_dot_emerald} />
                                            ) : null
                                          ) : (
                                            isSelected && (
                                              isMultiChoice ? (
                                                <Check size={14} style={{ color: "#ffffff", fontWeight: "bold" }} />
                                              ) : (
                                                <div className={styles.radio_dot_white} />
                                              )
                                            )
                                          )}
                                        </div>
                                        <span className={styles.option_label}>{opt}</span>
                                      </div>

                                      {isReviewing && isSelected && isOptionCorrect && (
                                        <span className={styles.badge_choice_correct}>
                                          ✓ Your Choice (Correct)
                                        </span>
                                      )}
                                      {isReviewing && isSelected && !isOptionCorrect && (
                                        <span className={styles.badge_choice_incorrect}>
                                          ✕ Your Choice (Incorrect)
                                        </span>
                                      )}
                                      {isReviewing && !isSelected && isOptionCorrect && (
                                        <span className={styles.badge_choice_answer}>
                                          Correct Answer
                                        </span>
                                      )}
                                    </label>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Bottom Pagination / Navigation Bar */}
                      <div className={styles.question_nav_bar}>
                        {currentQuestionIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                            className={styles.btn_q_nav}
                          >
                            Prev
                          </button>
                        )}

                        {activeQuizQuestions.map((q, qIdx) => {
                          const isCurrent = qIdx === currentQuestionIndex;
                          const isAnswered = quizAnswers[q.id] !== undefined;

                          let navStyle = styles.btn_q_num;

                          if (isReviewing) {
                            const qUserAns = quizAnswers[q.id];
                            const qCorrect = isQuestionCorrect(q, qUserAns);
                            if (qUserAns === undefined) {
                              navStyle = `${styles.btn_q_num} ${styles.btn_q_num_rev_skipped}`;
                            } else if (qCorrect) {
                              navStyle = `${styles.btn_q_num} ${styles.btn_q_num_rev_correct}`;
                            } else {
                              navStyle = `${styles.btn_q_num} ${styles.btn_q_num_rev_incorrect}`;
                            }
                            if (isCurrent) {
                              navStyle += ` ${styles.btn_q_num_rev_active}`;
                            }
                          } else {
                            if (isCurrent) {
                              navStyle = `${styles.btn_q_num} ${styles.btn_q_num_current}`;
                            } else if (isAnswered) {
                              navStyle = `${styles.btn_q_num} ${styles.btn_q_num_answered}`;
                            }
                          }

                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setCurrentQuestionIndex(qIdx)}
                              className={navStyle}
                            >
                              {qIdx + 1}
                            </button>
                          );
                        })}

                        {currentQuestionIndex < activeQuizQuestions.length - 1 && (
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                            className={styles.btn_q_nav}
                          >
                            Next
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div
                    className={styles.lesson_body_html}
                    dangerouslySetInnerHTML={{ __html: lessonContentHtml }}
                  />

                  {/* Complete & Finish Buttons */}
                  <div className={styles.lesson_actions_bar}>
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
                      {isCompleting ? (
                        "Processing..."
                      ) : isCurrentCompleted ? (
                        <span className={styles.icon_label_group}>
                          <Check size={16} /> Completed
                        </span>
                      ) : (
                        "Complete"
                      )}
                    </button>

                    {isEligibleToFinish && (
                      <button
                        type="button"
                        onClick={handleFinishCourse}
                        disabled={isFinishingCourse}
                        className={`${styles.btn_finish_course_content} ${isCourseFinished ? styles.btn_course_finished_done : ""}`}
                        style={{ marginLeft: 0 }}
                      >
                        {isFinishingCourse ? (
                          "Finishing..."
                        ) : isCourseFinished ? (
                          <span className={styles.icon_label_group}>
                            <Check size={16} /> Course Finished
                          </span>
                        ) : (
                          "Finish Course"
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Comment Section ("Leave a Reply") - ONLY for Lessons, NOT for Quizzes, AND NOT when Blocked */}
              {!(isQuizPage || isQuiz) && !progress?.is_blocked && (
                <div className={styles.comments_section}>
                  {/* Lesson Comments List */}
                  <div className={styles.learn_press_comments}>
                    <div id="comments" className={styles.comments_area}>
                      <h2 className={styles.comments_list_title}>
                        {commentsList.length} {commentsList.length === 1 ? "Comment" : "Comments"}
                      </h2>

                      {loadingComments ? (
                        <div className={styles.no_comments_notice}>
                          Loading comments...
                        </div>
                      ) : commentsList.length > 0 ? (
                        <ol className={styles.comment_list}>
                          {commentsList.map((comment) => (
                            <li key={comment.id} className={styles.comment_item}>
                              <article className={styles.single_comment}>
                                <div className={styles.comment_each_item}>
                                  <div className={styles.comment_avatar}>
                                    <img
                                      alt="User Avatar"
                                      src={comment.avatar}
                                      height={50}
                                      width={50}
                                      className={styles.avatar_round}
                                    />
                                  </div>

                                  <div className={styles.comment_media_body}>
                                    <div className={styles.comment_header}>
                                      <h4 className={styles.comment_author_heading}>
                                        {comment.author}
                                      </h4>
                                      <span className={styles.comment_metadata}>
                                        <time>{comment.date}</time>
                                      </span>
                                    </div>

                                    {comment.awaitingModeration && (
                                      <p className={styles.comment_awaiting_moderation}>
                                        Your comment is awaiting moderation. This is a preview, your comment will be visible after it has been approved.
                                      </p>
                                    )}

                                    <div className={styles.comment_body_text}>
                                      {comment.content}
                                    </div>

                                    <div className={styles.comment_bottom_part}>
                                      <button type="button" className={styles.comment_reply_link}>
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </article>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </div>
                  </div>

                  {/* Form section: Leave a Reply */}
                  <div id="respond" className={styles.comment_respond}>
                    <h3 className={styles.comments_title}>Leave a Reply</h3>
                    <p className={styles.logged_in_as}>
                      Logged in as <strong>{user?.username || "student"}</strong>. <Link href="/my-account/personal-info">Edit your profile</Link>. Required fields are marked <span className={styles.required_star}>*</span>
                    </p>

                    {commentPosted && (
                      <div className={styles.comment_success_alert}>
                        ✅ Your comment has been posted successfully!
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
              )}
            </div>

            {/* Footer Navigation */}
            <footer className={styles.popup_footer}>
              <div className={styles.footer_navigation}>
                {prevItem ? (
                  <Link
                    href={
                      (prevItem.type === "lp_quiz" || prevItem.title?.toLowerCase().includes("quiz") || prevItem.title?.toLowerCase().includes("review"))
                        ? `/courses/${slug}/quizzes/${prevItem.slug || prevItem.id}`
                        : `/courses/${slug}/lessons/${prevItem.slug || prevItem.id}`
                    }
                    className={`${styles.nav_btn} ${styles.has_tooltip}`}
                    title={prevItem.title}
                  >
                    <ArrowLeft /> <span>Prev</span>
                    <span className={styles.tooltip_text}>{prevItem.title}</span>
                  </Link>
                ) : (
                  <span className={`${styles.nav_btn} ${styles.nav_btn_disabled}`}><ArrowLeft /> <span>Prev</span></span>
                )}

                {nextItem ? (
                  <Link
                    href={
                      (nextItem.type === "lp_quiz" || nextItem.title?.toLowerCase().includes("quiz") || nextItem.title?.toLowerCase().includes("review"))
                        ? `/courses/${slug}/quizzes/${nextItem.slug || nextItem.id}`
                        : `/courses/${slug}/lessons/${nextItem.slug || nextItem.id}`
                    }
                    className={`${styles.nav_btn} ${styles.has_tooltip}`}
                    title={nextItem.title}
                  >
                    <span>Next</span> <ArrowRight />
                    <span className={styles.tooltip_text}>{nextItem.title}</span>
                  </Link>
                ) : (
                  <span className={`${styles.nav_btn} ${styles.nav_btn_disabled}`}><span>Next</span> <ArrowRight /></span>
                )}
              </div>
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
              <p className={styles.modal_finish_title}>
                You have successfully completed <strong>{courseTitle}</strong>!
              </p>
              <p className={styles.modal_finish_desc}>
                Your learning progress reached <strong>{progressPercent}%</strong> (Passing grade: {passingGrade}%). Your completion status has been saved.
              </p>
            </div>
            <div className={styles.modal_footer}>
              <Link href={`/courses/${slug}`} className={styles.btn_modal_yes} style={{ textDecoration: "none" }}>
                Back to course page
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Submit Quiz Confirmation Modal */}
      {showSubmitQuizModal && (
        <div className={styles.modal_backdrop} onClick={() => setShowSubmitQuizModal(false)}>
          <div
            className={styles.modal_quiz_card}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modal_quiz_title}>
              Are you sure to submit the quiz?
            </div>

            <div className={styles.modal_quiz_actions}>
              <button
                type="button"
                onClick={() => setShowSubmitQuizModal(false)}
                className={styles.btn_modal_cancel}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSubmitQuizModal(false);
                  handleFinishQuizClick();
                }}
                className={styles.btn_modal_ok}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retake Quiz Confirmation Modal */}
      {showRetakeModal && (
        <div className={styles.modal_backdrop} onClick={() => setShowRetakeModal(false)}>
          <div
            className={styles.modal_quiz_card}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modal_quiz_title}>
              Are you sure you want to retake the quiz?
            </div>

            <div className={styles.modal_quiz_actions}>
              <button
                type="button"
                onClick={() => setShowRetakeModal(false)}
                className={styles.btn_modal_cancel}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRetakingQuiz}
                onClick={handleConfirmRetake}
                className={styles.btn_modal_ok}
              >
                {isRetakingQuiz ? "Processing..." : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRepurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
                🛒
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Repurchase Course (Đăng ký học lại)</h3>
                <p className="text-xs text-slate-400">Chọn tùy chọn tiến trình học tập của bạn:</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={isRepurchasing}
                onClick={() => handleRepurchase("reset")}
                className="w-full text-left p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all hover:border-emerald-500/50 group"
              >
                <div className="flex items-center justify-between font-semibold text-emerald-400 text-sm">
                  <span>1. Reset course progress</span>
                  <span className="text-xs text-slate-400 group-hover:text-emerald-300">Tái khởi tạo →</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  The course progress and results of student will be removed. (Xóa toàn bộ kết quả cũ và học lại từ đầu).
                </p>
              </button>

              <button
                type="button"
                disabled={isRepurchasing}
                onClick={() => handleRepurchase("keep")}
                className="w-full text-left p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all hover:border-blue-500/50 group"
              >
                <div className="flex items-center justify-between font-semibold text-blue-400 text-sm">
                  <span>2. Keep course progress</span>
                  <span className="text-xs text-slate-400 group-hover:text-blue-300">Gia hạn →</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  The course progress and results of student will remain. (Giữ nguyên các bài đã học & mở lại khóa học).
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={isRepurchasing}
                onClick={() => setShowRepurchaseModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
