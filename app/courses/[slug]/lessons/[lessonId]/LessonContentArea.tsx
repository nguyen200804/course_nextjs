"use client";

import React from "react";
import LearnDashVideoPlayer from "./LearnDashVideoPlayer";

interface LessonContentAreaProps {
  displayOptions: any;
  activeLesson: any;
  courseId: string;
  lessonId: string;
  isCompleted: boolean;
  isLoggedIn: boolean;
  slug: string;
  onVideoEnded?: () => void;
}

export default function LessonContentArea({
  displayOptions,
  activeLesson,
  courseId,
  lessonId,
  isCompleted,
  isLoggedIn,
  slug,
  onVideoEnded,
}: LessonContentAreaProps) {
  const videoProgression = displayOptions?.video_progression;
  const isVideoEnabled = !!(videoProgression?.enabled && videoProgression?.url);
  const displayTiming = videoProgression?.display_timing || "BEFORE";

  return (
    <div className="space-y-8">
      {/* 1. Video Progression Player (khi timing = BEFORE) */}
      {isVideoEnabled && (displayTiming === "BEFORE" || !displayTiming) && (
        <div className="mb-8">
          <LearnDashVideoPlayer
            url={videoProgression.url}
            autostart={videoProgression.autostart}
            controlsDisplay={videoProgression.controls_display}
            pauseUnfocused={videoProgression.pause_window_unfocused}
            resume={videoProgression.resume}
            lessonId={lessonId}
            onVideoEnded={onVideoEnded}
          />
        </div>
      )}

      {/* 2. Nội dung bài giảng chính */}
      <article
        className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-6"
        dangerouslySetInnerHTML={{ __html: activeLesson.content.rendered }}
      />

      {/* 3. Video Progression Player (khi timing = AFTER) */}
      {isVideoEnabled && displayTiming === "AFTER" && (
        <div className="mt-8">
          <LearnDashVideoPlayer
            url={videoProgression.url}
            autostart={videoProgression.autostart}
            controlsDisplay={videoProgression.controls_display}
            pauseUnfocused={videoProgression.pause_window_unfocused}
            resume={videoProgression.resume}
            lessonId={lessonId}
            onVideoEnded={onVideoEnded}
          />
        </div>
      )}

      {/* 4. Lesson Materials */}
      {displayOptions?.materials?.enabled && displayOptions?.materials?.content && (
        <div className="mt-8 p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-lg">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            📁 Tài liệu học tập (Lesson Materials)
          </h3>
          <div
            className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: displayOptions.materials.content }}
          />
        </div>
      )}

      {/* 5. Assignment Uploads */}
      {displayOptions?.assignment_uploads && (
        <div className="mt-8 p-6 rounded-2xl bg-slate-950/60 border border-purple-500/20 shadow-lg">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            📤 Nộp bài tập học viên (Assignment Upload)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Bài học này yêu cầu bạn nộp file bài tập để hoàn thành.
          </p>
          <div className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-900/30">
            <div className="text-3xl mb-2">📄</div>
            <p className="text-xs text-slate-300 font-semibold mb-1">
              Kéo thả file vào đây hoặc <span className="text-purple-400 underline">chọn file từ máy tính</span>
            </p>
            <p className="text-[10px] text-slate-500">Hỗ trợ các định dạng PDF, DOCX, ZIP, PNG, JPG (Tối đa 20MB)</p>
          </div>
        </div>
      )}

      {/* 6. Forced Lesson Timer */}
      {displayOptions?.forced_lesson_timer && Number(displayOptions.forced_lesson_timer) > 0 && (
        <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <span className="flex items-center gap-2 font-medium">
            ⏱️ Thời gian bắt buộc hoàn thành bài học:
          </span>
          <span className="font-bold font-mono text-sm bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-500/40">
            {displayOptions.forced_lesson_timer} giây
          </span>
        </div>
      )}
    </div>
  );
}
