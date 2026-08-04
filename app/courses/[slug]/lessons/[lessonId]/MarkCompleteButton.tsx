"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface MarkCompleteButtonProps {
  courseId: string;
  lessonId: string;
  isCompleted: boolean;
  isLoggedIn: boolean;
  slug: string;
  videoProgressionEnabled?: boolean;
  isVideoEnded?: boolean;
}

export default function MarkCompleteButton({
  courseId,
  lessonId,
  isCompleted: initialCompleted,
  isLoggedIn,
  slug,
  videoProgressionEnabled = false,
  isVideoEnded = false,
}: MarkCompleteButtonProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState<boolean>(initialCompleted);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isVideoLocked = videoProgressionEnabled && !isVideoEnded;
  const isDisabled = loading || isVideoLocked;

  const handleMarkComplete = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/courses/${slug}/lessons/${lessonId}`);
      return;
    }

    if (completed || isDisabled) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/mark-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId, lessonId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCompleted(true);
        // Refresh Server Component data to update progress bar & unlock next lesson
        router.refresh();
      } else {
        setErrorMsg(data.message || "Could not mark as complete.");
      }
    } catch (err: any) {
      console.error("Error marking lesson complete:", err);
      setErrorMsg("A connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Completed state
  if (completed) {
    return (
      <div className="w-full">
        <button
          disabled
          className="w-full h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 shadow-md cursor-default transition-all"
        >
          <span>✓</span>
          <span>Lesson Completed</span>
        </button>
      </div>
    );
  }

  // 2. Normal or video-locked state
  return (
    <div className="w-full space-y-2">
      <button
        onClick={handleMarkComplete}
        disabled={isDisabled}
        title={isVideoLocked ? "You need to watch the entire video to mark this lesson complete" : undefined}
        className={`w-full h-11 rounded-xl flex items-center justify-center text-xs font-bold text-white transition-all ${isDisabled
            ? "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60"
            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-[0.98] cursor-pointer"
          }`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Processing...
          </span>
        ) : (
          "Mark as Complete"
        )}
      </button>
      {errorMsg && (
        <p className="text-[10px] text-red-400 text-center font-medium">
          ⚠️ {errorMsg}
        </p>
      )}
    </div>
  );
}
