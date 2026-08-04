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
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, any>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [lastAttempt, setLastAttempt] = useState<any>(null);
  const [attemptsList, setAttemptsList] = useState<any[]>([]);
  const [loadingLastAttempt, setLoadingLastAttempt] = useState<boolean>(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [showSubmitQuizModal, setShowSubmitQuizModal] = useState(false);

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

  // Fetch Last Attempt from LearnPress DB
  useEffect(() => {
    const targetQuizId = activeItem?.id || lessonId;
    const isQuizType = isQuizPage || activeLesson?.item_type === "lp_quiz" || activeLesson?.type === "lp_quiz" || activeItem?.type === "lp_quiz" || (activeItem?.title && (activeItem.title.toLowerCase().includes("quiz") || activeItem.title.toLowerCase().includes("review")));
    if (!targetQuizId || !user?.id || !isQuizType) {
      setLastAttempt(null);
      setAttemptsList([]);
      return;
    }

    setLoadingLastAttempt(true);
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL || "https://test4.questx.com.vn";
    fetch(`${wpUrl}/wp-json/custom/v1/quiz-attempts?user_id=${user.id}&quiz_id=${targetQuizId}&t=${Date.now()}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.last_attempt) {
          setLastAttempt(data.last_attempt);
          const list = Array.isArray(data.attempts) && data.attempts.length > 0 ? data.attempts : [data.last_attempt];
          setAttemptsList(list);
          logQuizAttemptsNextJS(list, activeItem?.title || activeLesson?.title?.rendered);
        } else {
          setLastAttempt(null);
          setAttemptsList([]);
        }
      })
      .catch(() => {
        setLastAttempt(null);
        setAttemptsList([]);
      })
      .finally(() => setLoadingLastAttempt(false));
  }, [activeItem, lessonId, user?.id, isQuizPage, activeLesson]);

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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    const isQuizType = isQuizPage || activeLesson?.item_type === "lp_quiz" || activeLesson?.type === "lp_quiz" || activeItem?.type === "lp_quiz" || (activeItem?.title && (activeItem.title.toLowerCase().includes("quiz") || activeItem.title.toLowerCase().includes("review")));
    if (isQuizType) {
      const quizIdOrSlug = activeItem?.id || activeLesson?.id || activeLesson?.slug || lessonId;
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
      const userSelected: number[] = Array.isArray(ans) ? [...ans].sort() : [ans];
      let correctArr: number[] = [];
      if (Array.isArray(q.correct)) {
        correctArr = [...q.correct].sort();
      } else if (typeof q.correct === "number") {
        correctArr = [q.correct];
      }
      return userSelected.length > 0 && userSelected.length === correctArr.length && userSelected.every((val, index) => val === correctArr[index]);
    }
    return Number(ans) === Number(q.correct);
  };

  const handleFinishQuizClick = async () => {
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
    setQuizSubmitted(true);
    setQuizStarted(false);

    const targetId = activeItem?.id || lessonId;
    const numId = Number(targetId);
    setCompletedList((prev) => Array.from(new Set([...prev, ...(isNaN(numId) ? [] : [numId])])));

    const correctCount = activeQuizQuestions.filter((q) => isQuestionCorrect(q, quizAnswers[q.id])).length;
    const wrongCount = activeQuizQuestions.filter((q) => quizAnswers[q.id] !== undefined && !isQuestionCorrect(q, quizAnswers[q.id])).length;
    const skippedCount = activeQuizQuestions.filter((q) => quizAnswers[q.id] === undefined).length;
    const totalCount = activeQuizQuestions.length || 1;

    const newAttemptRecord = {
      user_item_id: Date.now(),
      status: "completed",
      graduation: finalScore >= passingGrade ? "passed" : "failed",
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      time_spent: formatTimerSeconds(timeSpent) || "00:00:00",
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

    setLastAttempt(newAttemptRecord);
    setAttemptsList((prev) => {
      const updated = [...prev, newAttemptRecord];
      logQuizAttemptsNextJS(updated, activeItem?.title || activeLesson?.title?.rendered);
      return updated;
    });

    // Đồng bộ hoàn thành Quiz về WordPress REST API
    try {
      await fetch("/api/mark-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: targetId,
          user_id: user?.id,
          quiz_score: finalScore,
        }),
      });

      if (user?.id && targetId) {
        const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL || "https://test4.questx.com.vn";
        const attRes = await fetch(`${wpUrl}/wp-json/custom/v1/quiz-attempts?user_id=${user.id}&quiz_id=${targetId}&t=${Date.now()}`, { cache: "no-store" });
        if (attRes.ok) {
          const attData = await attRes.json();
          if (attData && attData.success && Array.isArray(attData.attempts) && attData.attempts.length > 0) {
            setAttemptsList(attData.attempts);
            setLastAttempt(attData.last_attempt || attData.attempts[attData.attempts.length - 1]);
            logQuizAttemptsNextJS(attData.attempts, activeItem?.title || activeLesson?.title?.rendered);
          }
        }
      }
    } catch (e) {
      console.error("Lỗi khi đồng bộ kết quả Quiz sang WordPress:", e);
    }
  };

  // Helper calculations for Quiz Result Card
  const currentCalculatedScore = Math.round(
    ((activeQuizQuestions.filter((q) => isQuestionCorrect(q, quizAnswers[q.id])).length) / (activeQuizQuestions.length || 1)) * 100
  );

  const displayQuizScore = quizSubmitted
    ? (quizScore !== null ? quizScore : currentCalculatedScore)
    : (lastAttempt ? Math.round(parseFloat(lastAttempt.result_num !== undefined ? lastAttempt.result_num : (lastAttempt.result || 0))) : 0);

  const isQuizPassed = quizSubmitted
    ? displayQuizScore >= passingGrade
    : (lastAttempt ? (lastAttempt.graduation === "passed" || displayQuizScore >= passingGrade) : false);

  const displayTimeSpent = quizSubmitted
    ? (formatTimerSeconds(timeSpent) || "00:00:00")
    : (lastAttempt?.time_spent || "00:00:00");

  const displayPoints = quizSubmitted
    ? `${activeQuizQuestions.filter((q) => isQuestionCorrect(q, quizAnswers[q.id])).length} / ${activeQuizQuestions.length || 1}`
    : (lastAttempt?.points || `${lastAttempt?.correct || 0} / ${lastAttempt?.questions || activeQuizQuestions.length || 2}`);

  const displayQuestionsCount = quizSubmitted
    ? (activeQuizQuestions.length || 1)
    : (lastAttempt?.questions || activeQuizQuestions.length || 2);

  const displayCorrectCount = quizSubmitted
    ? activeQuizQuestions.filter((q) => isQuestionCorrect(q, quizAnswers[q.id])).length
    : (lastAttempt?.correct !== undefined ? lastAttempt.correct : 0);

  const displayWrongCount = quizSubmitted
    ? Math.max(0, Object.keys(quizAnswers).length - activeQuizQuestions.filter((q) => quizAnswers[q.id] === q.correct).length)
    : (lastAttempt?.wrong !== undefined ? lastAttempt.wrong : 0);

  const displaySkippedCount = quizSubmitted
    ? Math.max(0, (activeQuizQuestions.length || 1) - Object.keys(quizAnswers).length)
    : (lastAttempt?.skipped !== undefined ? lastAttempt.skipped : Math.max(0, Number(displayQuestionsCount) - Number(displayCorrectCount) - Number(displayWrongCount)));

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
                    <div className="flex-1 min-w-0 pr-2">
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
                                        const isCurrent = activeQuizQuestions.length > 0 && (it.id === activeItem?.id || it.slug === activeItem?.slug);
                                        if (isCurrent) {
                                          return `${activeQuizQuestions.length} ${activeQuizQuestions.length === 1 ? "question" : "questions"}`;
                                        }
                                        if (it.questions_count) {
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
                                        if (activeQuizQuestions.length > 0) {
                                          return `${activeQuizQuestions.length} ${activeQuizQuestions.length === 1 ? "question" : "questions"}`;
                                        }
                                        return "1 question";
                                      })()}
                                    </span>
                                  )}
                                  {it.duration && <span className={styles.badge_duration}>{formatDurationText(it.duration)}</span>}
                                  {isItemLocked ? (
                                    <span className={styles.badge_locked} title="Locked - Please enroll">
                                      <LockKeyhole size={14} />
                                    </span>
                                  ) : (
                                    <span
                                      className={`${styles.badge_completed} ${!isDone ? styles.badge_uncompleted : ""}`}
                                      title={isDone ? "Passed / Completed" : "Not completed"}
                                    >
                                      <Check size={16} />
                                    </span>
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
            <div className="flex items-center gap-3 min-w-0 pr-4">

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
                    This content is protected. Please enroll in the course to unlock full access to lessons and quizzes.
                  </p>
                  <Link
                    href={`/courses/${slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                  >
                    <span>🚀</span> Enroll in course now
                  </Link>
                </div>
              ) : isQuizPage || isQuiz ? (
                <>
                  {!quizStarted ? (
                    (isCurrentCompleted || quizSubmitted || !!lastAttempt) ? (
                      <div className="my-8 p-8 bg-white border border-slate-100 rounded-2xl max-w-xl mx-auto shadow-sm text-center">
                        {/* Circular Gauge */}
                        <div className="relative w-40 h-40 mx-auto mb-6">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                            <circle
                              cx={80}
                              cy={80}
                              r={68}
                              className="text-slate-200 stroke-current"
                              strokeWidth={12}
                              fill="transparent"
                            />
                            <circle
                              cx={80}
                              cy={80}
                              r={68}
                              className="text-amber-500 stroke-current transition-all duration-700 ease-out"
                              strokeWidth={12}
                              strokeDasharray={2 * Math.PI * 68}
                              strokeDashoffset={(2 * Math.PI * 68) - ((displayQuizScore / 100) * (2 * Math.PI * 68))}
                              strokeLinecap="round"
                              fill="transparent"
                            />
                          </svg>

                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-extrabold text-slate-900 leading-none">
                              {displayQuizScore}%
                            </span>
                            <div className="w-8 h-[1px] bg-slate-300 my-1.5" />
                            <span className="text-sm font-medium text-slate-400">
                              {passingGrade}%
                            </span>
                          </div>
                        </div>

                        {/* Status Pill Badge */}
                        <div className="flex justify-center mb-8">
                          <div
                            className={`px-8 py-2.5 rounded-lg text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm min-w-[140px] ${isQuizPassed ? "bg-[#10b981]" : "bg-[#ef4444]"
                              }`}
                          >
                            {isQuizPassed ? (
                              <>
                                <span>Passed</span>
                                <span className="text-lg font-bold">✓</span>
                              </>
                            ) : (
                              <>
                                <span>Failed</span>
                                <span className="text-lg font-bold">✕</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Stats Table List */}
                        <div className="max-w-xs mx-auto space-y-3 text-sm text-slate-500 mb-8">
                          <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
                            <span>Time spent</span>
                            <span className="font-bold text-slate-800">
                              {displayTimeSpent}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
                            <span>Points</span>
                            <span className="font-bold text-slate-800">
                              {displayPoints}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
                            <span>Questions</span>
                            <span className="font-bold text-slate-800">{displayQuestionsCount}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
                            <span>Correct</span>
                            <span className="font-bold text-slate-800">{displayCorrectCount}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
                            <span>Wrong</span>
                            <span className="font-bold text-slate-800">{displayWrongCount}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
                            <span>Skipped</span>
                            <span className="font-bold text-slate-800">{displaySkippedCount}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
                            <span>Minus points</span>
                            <span className="font-bold text-slate-800">0</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setQuizStarted(true);
                              setQuizSubmitted(false);
                              setQuizAnswers({});
                              setCurrentQuestionIndex(0);
                              setTimeSpent(0);
                            }}
                            className="px-6 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                          >
                            Retake
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQuizStarted(true);
                              setCurrentQuestionIndex(0);
                            }}
                            className="px-6 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                          >
                            Review
                          </button>
                        </div>

                        {/* Attempts History Table ("Last Attempt" section) */}
                        {attemptsList.length > 0 && (
                          <div className="mt-10 pt-8 border-t border-slate-100 max-w-2xl mx-auto">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 text-left">
                              Last Attempt
                            </h3>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                              <table className="w-full text-sm text-left text-slate-600">
                                <thead className="text-xs uppercase bg-slate-100/70 border-b border-slate-200 font-bold text-slate-700">
                                  <tr>
                                    <th className="px-4 py-3">Questions</th>
                                    <th className="px-4 py-3">Time spent</th>
                                    <th className="px-4 py-3">Marks</th>
                                    <th className="px-4 py-3">Passing grade</th>
                                    <th className="px-4 py-3 text-right">Result</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {attemptsList.map((att: any, index: number) => (
                                    <tr key={att.user_item_id || index} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="px-4 py-3 font-medium text-slate-900">
                                        {att.questions || ""}
                                      </td>
                                      <td className="px-4 py-3 text-slate-600 font-mono">
                                        {att.time_spent || ""}
                                      </td>
                                      <td className="px-4 py-3 font-medium text-slate-800">
                                        {att.points || ""}
                                      </td>
                                      <td className="px-4 py-3 text-slate-600">
                                        {att.passing_grade || "80%"}
                                      </td>
                                      <td className={`px-4 py-3 font-bold text-right ${parseFloat(att.result || att.result_num || "0") >= 80 ? "text-emerald-600" : "text-red-500"
                                        }`}>
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

                        {/* Quiz Meta Information Card (Matching EduBlink / LearnPress Quiz detail design) */}
                        <div className="my-8 p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-4xl mx-auto">
                          <div className="flex flex-wrap items-center justify-around gap-4 sm:gap-8 pb-6 border-b border-slate-100 text-sm sm:text-base">
                            {/* Questions count */}
                            <div className="flex items-center gap-2.5 font-medium text-slate-800">
                              <Puzzle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                              <span>
                                <strong>Questions:</strong> {activeQuizQuestions.length > 0 ? activeQuizQuestions.length : (extractQuestionsCount(activeItem?.questions_count || activeLesson?.questions_count) || activeQuizQuestions.length || 1)}
                              </span>
                            </div>

                            {/* Duration */}
                            <div className="flex items-center gap-2.5 font-medium text-slate-800">
                              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                              <span>
                                <strong>Duration:</strong> {formatMetaDuration(activeItem?.duration || activeLesson?.duration)}
                              </span>
                            </div>

                            {/* Passing Grade */}
                            <div className="flex items-center gap-2.5 font-medium text-slate-800">
                              <BarChart2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
                              <span>
                                <strong>Passing grade:</strong> {passingGrade}%
                              </span>
                            </div>
                          </div>

                          {/* Start Button */}
                          <div className="pt-6 flex justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setQuizStarted(true);
                                setCurrentQuestionIndex(0);
                                setQuizSubmitted(false);
                              }}
                              className="px-10 py-3 bg-[#1ab69d] hover:bg-[#159681] text-white font-semibold rounded-xl text-base transition-all shadow-md shadow-[#1ab69d]/20 active:scale-95 cursor-pointer"
                            >
                              Start
                            </button>
                          </div>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="my-6 max-w-4xl mx-auto">
                      {/* Yellow/Gold Header Bar */}
                      <div className="bg-[#f59e0b] rounded-t-xl px-6 py-4 flex items-center justify-between text-slate-900 font-semibold shadow-sm">
                        <div className="text-base sm:text-lg">
                          Question <strong className="font-bold">{Math.min(currentQuestionIndex + 1, activeQuizQuestions.length)}</strong> of {activeQuizQuestions.length}
                        </div>

                        <div className="flex items-center gap-5">
                          {timeLeft !== null && (
                            <div className="flex items-center gap-1.5 text-base sm:text-lg font-bold">
                              <Clock size={18} />
                              <span>{formatTimerSeconds(timeLeft)}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowSubmitQuizModal(true)}
                            className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold px-5 py-2 rounded-lg text-xs sm:text-sm tracking-wider uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            FINISH QUIZ
                          </button>
                        </div>
                      </div>

                      {/* Current Question Box */}
                      <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-6 sm:p-8 shadow-sm">
                        {(() => {
                          const currentQ = activeQuizQuestions[Math.min(currentQuestionIndex, activeQuizQuestions.length - 1)];
                          const qId = currentQ?.id;
                          const qType = currentQ?.type || currentQ?.question_type || "single_choice";
                          const isMultiChoice = qType === "multi_choice" || qType === "multiple_choice";

                          return (
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                                  isMultiChoice ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                                }`}>
                                  {isMultiChoice ? "Multi Choice (Select multiple answers)" : "Single Choice"}
                                </span>
                              </div>

                              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-6 leading-relaxed">
                                {currentQ?.question}
                              </h3>

                              <div className="space-y-3">
                                {currentQ?.options?.map((opt: string, oIdx: number) => {
                                  const currentAns = quizAnswers[qId];
                                  const selectedArr: number[] = Array.isArray(currentAns)
                                    ? currentAns
                                    : (currentAns !== undefined ? [currentAns] : []);
                                  const isSelected = isMultiChoice
                                    ? selectedArr.includes(oIdx)
                                    : currentAns === oIdx;

                                  const handleToggleOption = () => {
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

                                  return (
                                    <label
                                      key={oIdx}
                                      onClick={handleToggleOption}
                                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                                        isSelected
                                          ? "border-amber-500 bg-amber-50/40 shadow-sm"
                                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white"
                                      }`}
                                    >
                                      <div
                                        className={`w-6 h-6 ${isMultiChoice ? "rounded-md" : "rounded-full"} border flex items-center justify-center flex-shrink-0 transition-colors ${
                                          isSelected
                                            ? "border-amber-500 bg-amber-500 text-white"
                                            : "border-slate-300 bg-white"
                                        }`}
                                      >
                                        {isSelected && (
                                          isMultiChoice ? (
                                            <Check size={14} className="text-white font-bold" />
                                          ) : (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                          )
                                        )}
                                      </div>
                                      <span className="text-sm sm:text-base text-slate-700 font-medium">{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Bottom Pagination / Navigation Bar */}
                      <div className="flex items-center justify-center gap-2 mt-8">
                        {currentQuestionIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                          >
                            Prev
                          </button>
                        )}

                        {activeQuizQuestions.map((q, qIdx) => {
                          const isCurrent = qIdx === currentQuestionIndex;
                          const isAnswered = quizAnswers[q.id] !== undefined;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setCurrentQuestionIndex(qIdx)}
                              className={`w-10 h-10 rounded-lg border font-semibold text-sm transition-all cursor-pointer ${isCurrent
                                  ? "border-amber-500 text-amber-600 bg-white shadow-sm ring-1 ring-amber-500"
                                  : isAnswered
                                    ? "border-slate-300 text-slate-700 bg-slate-100"
                                    : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                                }`}
                            >
                              {qIdx + 1}
                            </button>
                          );
                        })}

                        {currentQuestionIndex < activeQuizQuestions.length - 1 && (
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm cursor-pointer"
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
                      {isCompleting ? (
                        "Processing..."
                      ) : isCurrentCompleted ? (
                        <span className="inline-flex items-center gap-1">
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
                          <span className="inline-flex items-center gap-1">
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

              {/* Comment Section ("Leave a Reply") - ONLY for Lessons, NOT for Quizzes */}
              {!(isQuizPage || isQuiz) && (
                <div className={styles.comments_section}>
                  {/* Lesson Comments List */}
                  <div className={styles.learn_press_comments}>
                    <div id="comments" className={styles.comments_area}>
                      <h2 className={styles.comments_list_title}>
                        {commentsList.length} {commentsList.length === 1 ? "Comment" : "Comments"}
                      </h2>

                      {loadingComments ? (
                        <div className="p-4 text-slate-500 text-sm italic">
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
                                      className="rounded-full"
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
                      Logged in as <strong>{user?.username || "student"}</strong>. <Link href="/my-account/personal-info">Edit your profile</Link>. Required fields are marked <span className="text-red-500">*</span>
                    </p>

                    {commentPosted && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg mb-4 text-sm font-semibold">
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
              <p className="text-base font-semibold text-slate-800 mb-2">
                You have successfully completed <strong>{courseTitle}</strong>!
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
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
            className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-slate-800 text-lg font-medium mb-8">
              Are you sure to submit the quiz?
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setShowSubmitQuizModal(false)}
                className="px-6 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSubmitQuizModal(false);
                  handleFinishQuizClick();
                }}
                className="px-8 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
