"use client";

import React, { useEffect, useRef, useState } from "react";

interface LearnDashVideoPlayerProps {
  url: string;
  autostart?: boolean;
  controlsDisplay?: boolean;
  pauseUnfocused?: boolean;
  resume?: boolean;
  lessonId: string;
  onVideoEnded?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

function getYouTubeVideoId(url: string) {
  if (!url) return null;
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1]?.split("?")[0] || null;
  }
  if (url.includes("youtube.com/watch")) {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v");
    } catch (e) {
      const match = url.match(/[?&]v=([^&]+)/);
      return match ? match[1] : null;
    }
  }
  if (url.includes("youtube.com/embed/")) {
    return url.split("youtube.com/embed/")[1]?.split("?")[0] || null;
  }
  return null;
}

export default function LearnDashVideoPlayer({
  url,
  autostart = false,
  controlsDisplay = true,
  pauseUnfocused = false,
  resume = false,
  lessonId,
  onVideoEnded,
}: LearnDashVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerIntervalRef = useRef<any>(null);

  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [savedResumeTime, setSavedResumeTime] = useState<number>(0);

  const youtubeId = getYouTubeVideoId(url);

  // 1. Khôi phục thời gian đã xem và trạng thái đã xem hết video (Resume & Video Ended Feature)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isEndedSaved = localStorage.getItem(`ld_video_ended_${lessonId}`) === "true";
      if (isEndedSaved) {
        setIsEnded(true);
        if (onVideoEnded) onVideoEnded();
      } else {
        setIsEnded(false);
      }

      if (resume) {
        const saved = localStorage.getItem(`ld_video_time_${lessonId}`);
        if (saved) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && parsed > 0) {
            setSavedResumeTime(parsed);
          } else {
            setSavedResumeTime(0);
          }
        } else {
          setSavedResumeTime(0);
        }
      }
    }
  }, [resume, lessonId]);

  // 2. Xử lý video YouTube bằng YouTube iFrame Player API
  useEffect(() => {
    if (!youtubeId) return;

    let isSubscribed = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player || !containerRef.current) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }

      const initialTime = Math.floor(savedResumeTime);

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: {
          autoplay: autostart ? 1 : 0,
          controls: controlsDisplay ? 1 : 0,
          enablejsapi: 1,
          rel: 0,
          start: initialTime > 0 ? initialTime : 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            if (!isSubscribed) return;
            if (initialTime > 0) {
              event.target.seekTo(initialTime, true);
            }
            if (autostart) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            if (!isSubscribed) return;

            // State 0: ENDED (Xử lý khi video xem xong -> Lưu vào localStorage & gọi callback)
            if (event.data === 0) {
              setIsEnded(true);
              if (typeof window !== "undefined") {
                localStorage.setItem(`ld_video_ended_${lessonId}`, "true");
              }
              if (onVideoEnded) onVideoEnded();
            }

            // State 1: PLAYING -> Lưu vị trí xem
            if (event.data === 1 && resume) {
              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = setInterval(() => {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
                  const currTime = playerRef.current.getCurrentTime();
                  if (currTime > 0) {
                    localStorage.setItem(`ld_video_time_${lessonId}`, currTime.toString());
                  }
                }
              }, 1500);
            } else {
              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            }
          },
        },
      });
    };

    if (typeof window !== "undefined") {
      if (!window.YT || !window.YT.Player) {
        if (!document.getElementById("yt-iframe-api-script")) {
          const tag = document.createElement("script");
          tag.id = "yt-iframe-api-script";
          tag.src = "https://www.youtube.com/iframe_api";
          const firstScriptTag = document.getElementsByTagName("script")[0];
          firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const previousCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (previousCallback) previousCallback();
          initPlayer();
        };
      } else {
        initPlayer();
      }
    }

    return () => {
      isSubscribed = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [youtubeId, autostart, controlsDisplay, savedResumeTime, lessonId, resume]);

  // 3. Xử lý tính năng Pause On Window Unfocused (Dừng video khi rời trình duyệt / chuyển tab)
  useEffect(() => {
    if (!pauseUnfocused) return;

    const handlePause = () => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
        playerRef.current.pauseVideo();
      }
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handlePause();
    };

    const handleWindowBlur = () => {
      handlePause();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [pauseUnfocused]);

  // 4. Xử lý HTML5 Video (cho mp4 / webm)
  const handleHtml5TimeUpdate = () => {
    if (resume && videoRef.current) {
      const curr = videoRef.current.currentTime;
      if (curr > 0) {
        localStorage.setItem(`ld_video_time_${lessonId}`, curr.toString());
      }
    }
  };

  const handleHtml5Ended = () => {
    setIsEnded(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`ld_video_ended_${lessonId}`, "true");
    }
    if (onVideoEnded) onVideoEnded();
  };

  const handleHtml5LoadedMetadata = () => {
    if (videoRef.current && savedResumeTime > 0) {
      videoRef.current.currentTime = savedResumeTime;
    }
  };

  return (
    <div className="w-full relative space-y-2">
      <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30">
        {youtubeId ? (
          <div ref={containerRef} className="w-full h-full" />
        ) : (
          <video
            ref={videoRef}
            src={url}
            controls={controlsDisplay}
            autoPlay={autostart}
            onTimeUpdate={handleHtml5TimeUpdate}
            onEnded={handleHtml5Ended}
            onLoadedMetadata={handleHtml5LoadedMetadata}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Footer thông tin trạng thái Video Progression */}
      <div className="p-3 bg-slate-950/80 text-slate-400 text-xs flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 rounded-b-2xl">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-medium text-purple-300">
            ▶ Video bài học
          </span>
          {isEnded && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              ✓ Đã xem xong video
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pauseUnfocused && (
            <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full" title="Tự dừng khi chuyển tab">
              ⏸️ Tự dừng khi chuyển tab
            </span>
          )}
          {resume && (
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full" title="Tự lưu vị trí xem">
              💾 Tự lưu vị trí xem
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
