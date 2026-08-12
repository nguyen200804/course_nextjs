import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { fetchWPCourseBySlug } from "@/lib/api/courses";
import { checkUserCourseEnrollment, getLearnDashUserProgress, getQuizBySlug } from "@/lib/wordpress";
import LessonViewWrapper from "../../lessons/[lessonId]/LessonViewWrapper";

interface PageProps {
  params: Promise<{ slug: string; quizSlug: string }>;
}

export default async function QuizDetailPage({ params }: PageProps) {
  const { slug: courseSlug, quizSlug } = await params;

  let course: any = null;
  let activeLesson: any = null;
  let foundSectionItem: any = null;
  let lessons: any[] = [];
  let sections: any[] = [];
  let displayOptions: any = null;
  let error: string | null = null;
  let courseId = "";
  let targetNumericId = "";

  // Kiểm tra phiên đăng nhập của người dùng
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("session_user");
  const user = userCookie ? JSON.parse(userCookie.value) : null;

  let isUserPurchased = false;
  let progress: any = { completed_lessons: [], completed_topics: [] };
  let completedLessons: any[] = [];

  try {
    const wpUrl = process.env.WORDPRESS_URL || "https://test4.questx.com.vn";

    // 1. Tải thông tin khóa học LearnPress từ WordPress REST API bằng courseSlug
    let courseData = await fetchWPCourseBySlug(courseSlug);

    // Fallback: Tìm course chứa quiz nếu courseSlug không trực tiếp khớp
    if (!courseData && quizSlug) {
      try {
        const allCoursesRes = await fetch(`${wpUrl}/wp-json/wp/v2/lp_course?_embed=true&per_page=50`, { next: { revalidate: 60 } });
        if (allCoursesRes.ok) {
          const allCourses = await allCoursesRes.json();
          if (Array.isArray(allCourses)) {
            for (const c of allCourses) {
              if (c.sections && Array.isArray(c.sections)) {
                for (const sec of c.sections) {
                  if (sec.items && Array.isArray(sec.items)) {
                    const match = sec.items.find((it: any) =>
                      (it.slug && it.slug === quizSlug) ||
                      (it.item_id && it.item_id.toString() === quizSlug) ||
                      (it.id && it.id.toString() === quizSlug)
                    );
                    if (match) {
                      courseData = c;
                      foundSectionItem = match;
                      break;
                    }
                  }
                }
              }
              if (courseData) break;
            }
          }
        }
      } catch (e) {
        console.error("Error searching course for quiz:", e);
      }
    }

    if (courseData) {
      course = courseData;
      courseId = course.id.toString();
      sections = course.sections || [];
    }

    // 2. Tìm bài quiz trực tiếp từ course.sections trước bằng ID, Slug hoặc Tên bài
    if (Array.isArray(sections)) {
      for (const sec of sections) {
        if (sec.items && Array.isArray(sec.items)) {
          const match = sec.items.find((it: any) => {
            const rawId = (it.item_id || it.id || "").toString();
            const itTitle = typeof it.title === "object" ? it.title?.rendered : (it.title || it.name || it.post_title || "");
            const cleanTitleSlug = itTitle ? itTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : "";
            return (
              rawId === quizSlug ||
              (it.slug && it.slug.toString() === quizSlug) ||
              (cleanTitleSlug && cleanTitleSlug === quizSlug)
            );
          });
          if (match) {
            foundSectionItem = match;
            break;
          }
        }
      }
    }

    targetNumericId = foundSectionItem ? (foundSectionItem.item_id || foundSectionItem.id || "").toString() : (/^\d+$/.test(quizSlug) ? quizSlug : "");

    // 3. Tải thông tin chi tiết bài quiz từ REST API theo ID hoặc Slug
    try {
      let quizEndpoint = targetNumericId
        ? `${wpUrl}/wp-json/wp/v2/lp_quiz/${targetNumericId}?_embed=true`
        : `${wpUrl}/wp-json/wp/v2/lp_quiz?slug=${quizSlug}&_embed=true`;

      let quizRes = await fetch(quizEndpoint, { next: { revalidate: 60 } });

      if (quizRes.ok) {
        const quizData = await quizRes.json();
        const itemObj = Array.isArray(quizData) ? quizData[0] : quizData;
        if (itemObj && (itemObj.id || itemObj.content?.rendered)) {
          activeLesson = {
            ...itemObj,
            item_type: "lp_quiz",
          };
        }
      }

      if (!activeLesson || !activeLesson.content?.rendered) {
        let lessonEndpoint = targetNumericId
          ? `${wpUrl}/wp-json/wp/v2/lp_lesson/${targetNumericId}?_embed=true`
          : `${wpUrl}/wp-json/wp/v2/lp_lesson?slug=${quizSlug}&_embed=true`;

        let lessonRes = await fetch(lessonEndpoint, { next: { revalidate: 60 } });
        if (lessonRes.ok) {
          const lessonData = await lessonRes.json();
          const lessonObj = Array.isArray(lessonData) ? lessonData[0] : lessonData;
          if (lessonObj && (lessonObj.id || lessonObj.content?.rendered)) {
            activeLesson = {
              ...lessonObj,
              item_type: "lp_quiz",
            };
          }
        }
      }
    } catch (e) {
      console.error("Error fetching quiz from REST API:", e);
    }

    // Fallback if REST API does not return content but found in section
    if (foundSectionItem) {
      const fallbackTitle = foundSectionItem.title || foundSectionItem.name || foundSectionItem.post_title || "Quiz";
      if (!activeLesson) {
        activeLesson = {
          id: foundSectionItem.item_id || foundSectionItem.id || quizSlug,
          slug: foundSectionItem.slug || quizSlug,
          item_type: "lp_quiz",
          title: { rendered: fallbackTitle },
          content: { rendered: foundSectionItem.post_content || foundSectionItem.content || foundSectionItem.description || `<p>${fallbackTitle} content...</p>` },
          duration: foundSectionItem.duration || "",
          questions_count: foundSectionItem.questions_count || "2",
        };
      } else if (!activeLesson.title?.rendered || activeLesson.title.rendered === "Quiz") {
        activeLesson.title = { rendered: fallbackTitle };
      }
    }

    // Minimum fallback if still no activeLesson
    if (!activeLesson && foundSectionItem) {
      const fallbackTitle = foundSectionItem.title || foundSectionItem.name || foundSectionItem.post_title || "Quiz";
      activeLesson = {
        id: foundSectionItem.item_id || foundSectionItem.id || quizSlug,
        slug: foundSectionItem.slug || quizSlug,
        item_type: 'lp_quiz',
        title: { rendered: fallbackTitle },
        content: { rendered: foundSectionItem.post_content || foundSectionItem.content || foundSectionItem.description || `<p>Quiz content...</p>` },
        duration: foundSectionItem.duration || '',
        questions_count: foundSectionItem.questions_count || '',
      };
    }

    // 4. Xây dựng danh sách bài học phẳng
    const allLessonsList: any[] = [];
    if (Array.isArray(sections)) {
      sections.forEach((sec: any) => {
        if (sec.items && Array.isArray(sec.items)) {
          sec.items.forEach((item: any) => {
            const itemId = (item.item_id || item.id).toString();
            const itemSlug = item.slug || itemId;
            allLessonsList.push({
              id: itemId,
              item_id: itemId,
              slug: itemSlug,
              title: item.title || item.name || `Lesson #${itemId}`,
              post_title: item.title || item.name,
              type: item.item_type || item.type || 'lp_lesson',
              content: item.post_content || item.content || item.description || '',
              duration: item.duration || '',
            });
          });
        }
      });
    }

    lessons = allLessonsList;

    // 5. Kiểm tra trạng thái đã đăng ký (enrollment) và tiến trình học tập
    if (user && courseId) {
      isUserPurchased = await checkUserCourseEnrollment(user.id.toString(), courseId);
      progress = await getLearnDashUserProgress(user.id.toString(), courseId);
      completedLessons = progress?.completed_lessons || [];
      if (course && progress) {
        course.passingGrade = progress.passing_grade || 80;
        course.user_course_status = progress.user_course_status || "enrolled";
      }
    }
  } catch (err: any) {
    error = err.message || "Could not load details for this quiz.";
  }

  // Access rights
  const isPreviewLesson =
    activeLesson?.preview === true ||
    activeLesson?.preview === "yes" ||
    activeLesson?.preview === "1" ||
    activeLesson?.is_sample === true ||
    foundSectionItem?.preview === true ||
    foundSectionItem?.preview === "yes" ||
    foundSectionItem?.preview === "1";

  const canAccess = isUserPurchased || isPreviewLesson;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-6 mx-auto text-xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-red-300 mb-3">Error Loading Quiz</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6 leading-relaxed">{error}</p>
          <Link
            href={`/courses/${courseSlug}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Back to course
          </Link>
        </div>
      </div>
    );
  }

  const targetQuizId = (activeLesson?.id || targetNumericId || quizSlug).toString();

  return (
    <LessonViewWrapper
      displayOptions={displayOptions}
      activeLesson={activeLesson}
      course={course}
      courseId={courseId}
      lessonId={targetQuizId}
      completedLessons={completedLessons}
      user={user}
      slug={courseSlug}
      lessons={lessons}
      sections={sections}
      canAccess={canAccess}
      isUserPurchased={isUserPurchased}
      progress={progress}
      isQuizPage={true}
    />
  );
}
