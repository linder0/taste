"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface VideoScrubberProps {
  src: string;
  duration: number;
  className?: string;
}

export function VideoScrubber({ src, duration, className = "" }: VideoScrubberProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (isPlaying) video.pause();
          else video.play();
          break;
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 0.1);
          break;
        case "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(duration, video.currentTime + 0.1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, duration]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.pause();
    else video.play();
  };

  const handleScrubberClick = useCallback(
    (e: React.MouseEvent) => {
      const scrubber = scrubberRef.current;
      const video = videoRef.current;
      if (!scrubber || !video) return;

      const rect = scrubber.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      video.currentTime = Math.max(0, Math.min(duration, newTime));
    },
    [duration]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      handleScrubberClick(e);
    },
    [handleScrubberClick]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      handleScrubberClick(e);
    },
    [isDragging, handleScrubberClick]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      window.addEventListener("mouseup", handleGlobalMouseUp);
      return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [isDragging]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${className} h-full flex flex-col`}>
      {/* Video */}
      <div className="flex-1 rounded-xl overflow-hidden bg-black min-h-0 flex items-center justify-center">
        <video ref={videoRef} src={src} className="max-w-full max-h-full object-contain" loop playsInline />
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 mt-3">
        {/* Scrubber */}
        <div
          ref={scrubberRef}
          className="relative h-2 bg-surface-elevated rounded-full cursor-pointer select-none group"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-accent rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />

          {/* Playhead */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Time display and controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-hover transition-colors"
            >
              {isPlaying ? (
                <svg className="w-4 h-4 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <span className="text-sm font-mono text-muted">
              {formatTime(currentTime)} <span className="text-border">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="text-xs text-muted">
            Space to play • ←→ to scrub
          </div>
        </div>
      </div>
    </div>
  );
}
