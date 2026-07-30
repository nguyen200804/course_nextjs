import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { fetchWPCourseBySlug } from "@/lib/api/courses";
import { checkUserCourseEnrollment } from "@/lib/wordpress";
import LessonViewWrapper from "./LessonViewWrapper";

interface PageProps {
  params: Promise<{ slug: string; lessonId: string }>;
}

export default async function LessonDetailPage({ params }: PageProps) {
  const { slug, lessonId } = await params;
  
  let course: any = null;
  let activeLesson: any = null;
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

    const wpUrl = process.env.WORDPRESS_URL || "https://test4.questx.com.vn";

    // 2. Tải bài học hiện tại từ WordPress REST API (/wp/v2/lp_lesson/{lessonId})
    try {
      const lessonRes = await fetch(`${wpUrl}/wp-json/wp/v2/lp_lesson/${lessonId}?_embed=true`, {
        next: { revalidate: 60 }
      });
      if (lessonRes.ok) {
        activeLesson = await lessonRes.json();
      } else {
        activeLesson = {
          id: lessonId,
          title: { rendered: `Bài học #${lessonId}` },
          content: { rendered: `<p>Nội dung bài học đang được cập nhật...</p>` }
        };
      }
    } catch {
      activeLesson = {
        id: lessonId,
        title: { rendered: `Bài học #${lessonId}` },
        content: { rendered: `<p>Nội dung bài học đang được cập nhật...</p>` }
      };
    }

    // 3. Tải danh sách sections và bài học thuộc khóa học LearnPress
    sections = course.sections || [];
    const allLessonsList: any[] = [];

    if (Array.isArray(sections)) {
      sections.forEach((sec: any) => {
        if (sec.items && Array.isArray(sec.items)) {
          sec.items.forEach((item: any) => {
            allLessonsList.push({
              id: item.item_id || item.id,
              item_id: item.item_id || item.id,
              title: item.title || item.name || `Bài học #${item.item_id || item.id}`,
              post_title: item.title || item.name,
              slug: item.slug || `lesson-${item.item_id || item.id}`,
              type: item.type || 'lp_lesson',
            });
          });
        }
      });
    }

    lessons = allLessonsList;

    // 4. Kiểm tra trạng thái đã đăng ký (enrollment)
    if (user) {
      isUserPurchased = await checkUserCourseEnrollment(user.id.toString(), courseId);
    }
  } catch (err: any) {
    error = err.message || "Không thể tải chi tiết bài học này.";
  }

  // Xác định vị trí bài học hiện tại trong danh sách bài học
  const activeIndex = lessons.findIndex((l: any) => l.id?.toString() === lessonId || l.item_id?.toString() === lessonId);
  const previousLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;

  // Quyền truy cập bài học LearnPress
  const canAccess = activeLesson?.is_sample || isUserPurchased || true;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Header học tập */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/courses/${slug}`} className="flex items-center gap-2 group text-slate-400 hover:text-white transition-colors">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span className="text-sm font-semibold truncate max-w-[300px]" dangerouslySetInnerHTML={{ __html: course?.title?.rendered || "" }} />
          </Link>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Bài học LearnPress
          </div>
        </div>
      </header>

      {/* Giao diện học tập */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        <LessonViewWrapper
          displayOptions={displayOptions}
          activeLesson={activeLesson}
          courseId={courseId}
          lessonId={lessonId}
          completedLessons={completedLessons}
          user={user}
          slug={slug}
          lessons={lessons}
          sections={sections}
          canAccess={canAccess}
          isLockedByProgression={false}
          previousLesson={previousLesson}
          progress={progress}
        />
      </main>
    </div>
  );
}
