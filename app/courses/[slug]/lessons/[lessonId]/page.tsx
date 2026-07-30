import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { fetchWPCourseBySlug } from "@/lib/api/courses";
import { checkUserCourseEnrollment, getLearnDashUserProgress } from "@/lib/wordpress";
import LessonViewWrapper from "./LessonViewWrapper";

interface PageProps {
  params: Promise<{ slug: string; lessonId: string }>;
}

export default async function LessonDetailPage({ params }: PageProps) {
  const { slug, lessonId } = await params;
  
  let course: any = null;
  let activeLesson: any = null;
  let foundSectionItem: any = null;
  let lessons: any[] = [];
  let sections: any[] = [];
  let displayOptions: any = null;
  let error: string | null = null;
  let courseId = "";

  // Kiểm tra phiên đăng nhập của người dùng
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("session_user");
  const user = userCookie ? JSON.parse(userCookie.value) : null;

  let isUserPurchased = false;
  let progress: any = { completed_lessons: [], completed_topics: [] };
  let completedLessons: any[] = [];

  try {
    // 1. Tải thông tin khóa học LearnPress từ WordPress REST API bằng slug
    const courseData = await fetchWPCourseBySlug(slug);
    if (!courseData) {
      throw new Error("Không tìm thấy thông tin khóa học LearnPress.");
    }

    course = courseData;
    courseId = course.id.toString();
    sections = course.sections || [];

    const wpUrl = process.env.WORDPRESS_URL || "https://test4.questx.com.vn";
    const isNumericId = /^\d+$/.test(lessonId);

    // 2. Tìm bài học trực tiếp từ course.sections trước nếu có
    if (Array.isArray(sections)) {
      for (const sec of sections) {
        if (sec.items && Array.isArray(sec.items)) {
          const match = sec.items.find(
            (it: any) =>
              (it.item_id && it.item_id.toString() === lessonId) ||
              (it.slug && it.slug === lessonId) ||
              (it.id && it.id.toString() === lessonId)
          );
          if (match) {
            foundSectionItem = match;
            break;
          }
        }
      }
    }

    // 3. Tải thông tin chi tiết bài học từ REST API theo ID hoặc Slug
    try {
      let lessonEndpoint = isNumericId
        ? `${wpUrl}/wp-json/wp/v2/lp_lesson/${lessonId}?_embed=true`
        : `${wpUrl}/wp-json/wp/v2/lp_lesson?slug=${lessonId}&_embed=true`;

      let lessonRes = await fetch(lessonEndpoint, { next: { revalidate: 60 } });

      if (lessonRes.ok) {
        const lessonData = await lessonRes.json();
        const itemObj = Array.isArray(lessonData) ? lessonData[0] : lessonData;
        if (itemObj) {
          activeLesson = {
            ...itemObj,
            item_type: 'lp_lesson',
          };
        }
      }

      if (!activeLesson || !activeLesson.content?.rendered) {
        let quizEndpoint = isNumericId
          ? `${wpUrl}/wp-json/wp/v2/lp_quiz/${lessonId}?_embed=true`
          : `${wpUrl}/wp-json/wp/v2/lp_quiz?slug=${lessonId}&_embed=true`;

        let quizRes = await fetch(quizEndpoint, { next: { revalidate: 60 } });
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          const quizObj = Array.isArray(quizData) ? quizData[0] : quizData;
          if (quizObj) {
            activeLesson = {
              ...quizObj,
              item_type: 'lp_quiz',
            };
          }
        }
      }
    } catch (e) {
      console.error("Error fetching lesson from REST API:", e);
    }

    // Fallback nếu REST API không trả về nội dung nhưng tìm thấy trong section
    if (!activeLesson && foundSectionItem) {
      activeLesson = {
        id: foundSectionItem.item_id || foundSectionItem.id || lessonId,
        slug: foundSectionItem.slug || lessonId,
        item_type: foundSectionItem.item_type || foundSectionItem.type || 'lp_lesson',
        title: { rendered: foundSectionItem.title || foundSectionItem.name || foundSectionItem.post_title || `Bài học` },
        content: { rendered: foundSectionItem.post_content || foundSectionItem.content || foundSectionItem.description || '<p>Nội dung bài học đang được cập nhật...</p>' },
        duration: foundSectionItem.duration || '',
      };
    }

    // Nếu vẫn chưa có activeLesson, tạo fallback tối thiểu
    if (!activeLesson) {
      activeLesson = {
        id: lessonId,
        slug: lessonId,
        item_type: 'lp_lesson',
        title: { rendered: `Bài học` },
        content: { rendered: `<p>Nội dung bài học đang được cập nhật...</p>` },
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
              title: item.title || item.name || `Bài học #${itemId}`,
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
    if (user) {
      isUserPurchased = await checkUserCourseEnrollment(user.id.toString(), courseId);
      progress = await getLearnDashUserProgress(user.id.toString(), courseId);
      completedLessons = progress?.completed_lessons || [];
      if (course && progress) {
        course.passingGrade = progress.passing_grade || 80;
        course.user_course_status = progress.user_course_status || "enrolled";
      }
    }
  } catch (err: any) {
    error = err.message || "Không thể tải chi tiết bài học này.";
  }

  // Quyền truy cập bài học LearnPress
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
          <h2 className="text-xl font-bold text-red-300 mb-3">Lỗi tải bài học</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6 leading-relaxed">{error}</p>
          <Link
            href={`/courses/${slug}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Quay lại khóa học
          </Link>
        </div>
      </div>
    );
  }

  return (
    <LessonViewWrapper
      displayOptions={displayOptions}
      activeLesson={activeLesson}
      course={course}
      courseId={courseId}
      lessonId={lessonId}
      completedLessons={completedLessons}
      user={user}
      slug={slug}
      lessons={lessons}
      sections={sections}
      canAccess={canAccess}
      progress={progress}
    />
  );
}
