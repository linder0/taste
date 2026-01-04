"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ClipTimeline } from "@/types/project";

interface VideoScrubberProps {
  src: string;
  duration: number;
  markers?: ClipTimeline[];
  onTimeUpdate?: (time: number) => void;
  onAddMarker?: (time: number) => void;
  className?: string;
  compact?: boolean;
}

export function VideoScrubber({
  src,
  duration,
  markers = [],
  onTimeUpdate,
  onAddMarker,
  className = "",
  compact = false,
}: VideoScrubberProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

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
  }, [onTimeUpdate]);

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
        case "m":
          if (onAddMarker) {
            e.preventDefault();
            onAddMarker(video.currentTime);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, duration, onAddMarker]);

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
    if (compact) {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const getMarkerColor = (type: ClipTimeline["type"]) => {
    switch (type) {
      case "keyframe":
        return "bg-accent";
      case "note":
        return "bg-yellow-500";
      case "segment_start":
        return "bg-blue-500";
      case "segment_end":
        return "bg-blue-500";
      default:
        return "bg-muted";
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${className} h-full flex flex-col`}>
      {/* Video */}
      <div className="flex-1 rounded-lg overflow-hidden bg-black min-h-0 flex items-center justify-center">
        <video ref={videoRef} src={src} className="max-w-full max-h-full object-contain" loop playsInline />
      </div>

      {/* Controls */}
      <div className={`flex-shrink-0 ${compact ? "mt-2" : "mt-3"}`}>
        {/* Scrubber */}
        <div
          ref={scrubberRef}
          className={`relative ${compact ? "h-6" : "h-8"} bg-surface-elevated rounded cursor-pointer select-none`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-accent/30 rounded transition-all"
            style={{ width: `${progress}%` }}
          />

          {/* Markers */}
          {markers.map((marker) => (
            <div
              key={marker.id}
              className={`absolute top-0.5 ${compact ? "w-1.5 h-5" : "w-2 h-7"} rounded-full ${getMarkerColor(
                marker.type
              )} opacity-80 hover:opacity-100 transition-opacity`}
              style={{ left: `calc(${(marker.timestamp / duration) * 100}% - ${compact ? 3 : 4}px)` }}
              title={`${marker.type}: ${marker.content}`}
            />
          ))}

          {/* Playhead */}
          <div
            className={`absolute top-0 ${compact ? "w-0.5" : "w-1"} h-full bg-accent rounded-full shadow-lg`}
            style={{ left: `calc(${progress}% - ${compact ? 1 : 2}px)` }}
          />
        </div>

        {/* Time display and controls */}
        <div className={`flex items-center justify-between ${compact ? "mt-1.5" : "mt-2"}`}>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={`${compact ? "w-7 h-7" : "w-8 h-8"} flex items-center justify-center rounded bg-surface hover:bg-surface-hover transition-colors`}
            >
              {isPlaying ? (
                <svg className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} text-foreground`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} text-foreground ml-0.5`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <span className={`${compact ? "text-xs" : "text-sm"} font-mono text-foreground`}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {onAddMarker && !compact && (
            <button
              onClick={() => onAddMarker(currentTime)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add (M)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
