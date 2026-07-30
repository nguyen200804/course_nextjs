"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import LessonContentArea from "./LessonContentArea";
import MarkCompleteButton from "./MarkCompleteButton";

interface LessonViewWrapperProps {
  displayOptions: any;
  activeLesson: any;
  courseId: string;
  lessonId: string;
  completedLessons: number[];
  user: any;
  slug: string;
  lessons: any[];
  sections: any[];
  canAccess: boolean;
  isLockedByProgression: boolean;
  previousLesson: any;
  progress: any;
}

export default function LessonViewWrapper({
  displayOptions,
  activeLesson,
  courseId,
  lessonId,
  completedLessons,
  user,
  slug,
  lessons,
  sections,
  canAccess,
  isLockedByProgression,
  previousLesson,
  progress,
}: LessonViewWrapperProps) {
  const [isVideoEnded, setIsVideoEnded] = useState<boolean>(false);

  const videoProgression = displayOptions?.video_progression;
  const isVideoProgressionEnabled = !!(
    videoProgression?.enabled &&
    videoProgression?.url &&
    videoProgression?.display_timing !== "AFTER"
  );
  const isCurrentLessonCompleted = completedLessons.includes(Number(lessonId));

  // Tự động đồng bộ trạng thái xem video từ WordPress Server & LocalStorage
  useEffect(() => {
    const serverVideoCompleted = !!videoProgression?.user_video_completed;

    if (serverVideoCompleted || isCurrentLessonCompleted) {
      setIsVideoEnded(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(`ld_video_ended_${lessonId}`, "true");
      }
    } else if (typeof window !== "undefined") {
      const isEndedSaved = localStorage.getItem(`ld_video_ended_${lessonId}`) === "true";
      if (isEndedSaved) {
        setIsVideoEnded(true);
      }
    }
  }, [lessonId, isCurrentLessonCompleted, videoProgression?.user_video_completed]);

  const handleVideoEnded = async () => {
    setIsVideoEnded(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`ld_video_ended_${lessonId}`, "true");
    }
    try {
      await fetch("/api/video-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
    } catch (e) {
      console.error("Lỗi lưu tiến trình video lên server:", e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Cột trái (3/4 chiều rộng): Nội dung bài học */}
      <div className="lg:col-span-3 space-y-8">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">Bài học</span>
          <h1
            className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-8 leading-tight"
            dangerouslySetInnerHTML={{ __html: activeLesson.title.rendered }}
          />

          {/* Nội dung bài giảng hoặc Màn hình khóa */}
          {canAccess ? (
            <LessonContentArea
              displayOptions={displayOptions}
              activeLesson={activeLesson}
              courseId={courseId}
              lessonId={lessonId}
              isCompleted={isCurrentLessonCompleted}
              isLoggedIn={!!user}
              slug={slug}
              onVideoEnded={handleVideoEnded}
            />
          ) : isLockedByProgression ? (
            <div className="border border-slate-800/60 rounded-2xl bg-slate-950/40 p-8 text-center my-6 shadow-inner">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-bold text-amber-400 mb-2">Bài học này đang bị khóa</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                Bạn cần hoàn thành bài học trước đó:{" "}
                <strong
                  className="text-white"
                  dangerouslySetInnerHTML={{ __html: previousLesson?.title.rendered }}
                />{" "}
                để có thể mở khóa và tiếp tục bài giảng này.
              </p>
              <Link
                href={`/courses/${slug}/lessons/${previousLesson?.id}`}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 px-6 text-xs font-bold text-white transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                Quay lại bài học trước
              </Link>
            </div>
          ) : (
            <div className="border border-slate-800/60 rounded-2xl bg-slate-950/40 p-8 text-center my-6 shadow-inner">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-bold text-red-400 mb-2">Bài học này có phí</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                Bài học này không nằm trong chương trình học thử miễn phí. Vui lòng đăng ký hoặc mua khóa học để mở khóa toàn bộ nội dung bài giảng.
              </p>
              <Link
                href={`/courses/${slug}`}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 px-6 text-xs font-bold text-white transition-all shadow-lg shadow-purple-500/20"
              >
                Mua khóa học ngay
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Cột phải (1/4 chiều rộng): Sidebar giáo trình bài học LearnPress */}
      <div className="lg:col-span-1">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-xl shadow-xl sticky top-24">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            📂 Giáo trình khóa học
          </h3>

          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
            {sections && sections.length > 0 ? (
              sections.map((section: any, secIdx: number) => (
                <div key={section.section_id || secIdx} className="space-y-2">
                  {/* Tiêu đề Section */}
                  <div className="pt-2 pb-1 border-b border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                        {section.title || `Phần ${secIdx + 1}`}
                      </h4>
                    </div>
                  </div>

                  {/* Danh sách bài học của Section */}
                  <div className="space-y-2">
                    {section.items && Array.isArray(section.items) ? (
                      section.items.map((item: any, itemIdx: number) => {
                        const itemId = (item.item_id || item.id).toString();
                        const isCurrent = itemId === lessonId;
                        const isCompleted = completedLessons.includes(Number(itemId));
                        const itemTitle = typeof item.title === 'object' ? (item.title?.rendered || '') : (item.title || item.post_title || item.name || `Bài học #${itemId}`);

                        return (
                          <div
                            key={itemId}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 ${
                              isCurrent
                                ? "bg-purple-950/40 border-purple-500/60 text-purple-300 font-semibold"
                                : "bg-slate-950/40 border-slate-900 hover:border-slate-800 hover:bg-slate-900 text-slate-300"
                            }`}
                          >
                            <div
                              className={`h-6 w-6 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                isCurrent
                                  ? "bg-purple-600 text-white"
                                  : isCompleted
                                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                                  : "bg-slate-900 border border-slate-800 text-slate-400"
                              }`}
                            >
                              {isCompleted ? "✓" : itemIdx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/courses/${slug}/lessons/${itemId}`}
                                className={`text-xs font-medium block truncate transition-colors ${
                                  isCurrent ? "text-purple-300 font-bold" : "text-slate-300 hover:text-white"
                                }`}
                                dangerouslySetInnerHTML={{ __html: itemTitle }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              /* Fallback nếu không chia Sections */
              lessons.map((lesson: any, index: number) => {
                const itemId = (lesson.id || lesson.item_id).toString();
                const isCurrent = itemId === lessonId;
                const isCompleted = completedLessons.includes(Number(itemId));
                const itemTitle = typeof lesson.title === 'object' ? (lesson.title?.rendered || '') : (lesson.title || lesson.post_title || lesson.name || `Bài học #${itemId}`);

                return (
                  <div
                    key={itemId}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 ${
                      isCurrent
                        ? "bg-purple-950/40 border-purple-500/60 text-purple-300 font-semibold"
                        : "bg-slate-950/40 border-slate-900 hover:border-slate-800 hover:bg-slate-900 text-slate-300"
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? "bg-purple-600 text-white"
                          : isCompleted
                          ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                          : "bg-slate-900 border border-slate-800 text-slate-400"
                      }`}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/courses/${slug}/lessons/${itemId}`}
                        className={`text-xs font-medium block truncate transition-colors ${
                          isCurrent ? "text-purple-300 font-bold" : "text-slate-300 hover:text-white"
                        }`}
                        dangerouslySetInnerHTML={{ __html: itemTitle }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Nút Đánh dấu hoàn thành ở sidebar */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <MarkCompleteButton
              courseId={courseId}
              lessonId={lessonId}
              isCompleted={isCurrentLessonCompleted}
              isLoggedIn={!!user}
              slug={slug}
              videoProgressionEnabled={isVideoProgressionEnabled}
              isVideoEnded={isVideoEnded}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
