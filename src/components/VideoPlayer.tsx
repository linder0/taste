"use client";

import { useState, useEffect, useRef } from "react";
import { Spinner, DownloadIcon, PlusIcon, CheckIcon } from "@/components/ui";

interface VideoPlayerProps {
  videoUrl: string;
  imageUrl: string;
  prompt: string;
  duration: number;
  aspectRatio: string;
  onReset: () => void;
  isNewVideo?: boolean;
  onClipSaved?: () => void;
}

export function VideoPlayer({
  videoUrl,
  imageUrl,
  prompt,
  duration,
  aspectRatio,
  onReset,
  isNewVideo = false,
  onClipSaved,
}: VideoPlayerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [saved, setSaved] = useState(!isNewVideo);
  const savedVideoRef = useRef<string | null>(null);

  // Auto-save clip only for newly generated videos
  useEffect(() => {
    if (!isNewVideo) return;
    if (savedVideoRef.current === videoUrl) return; // Already saved this video

    savedVideoRef.current = videoUrl;

    const saveClip = async () => {
      try {
        await fetch("/api/clips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl,
            imageUrl,
            prompt,
            duration,
            aspectRatio,
          }),
        });
        setSaved(true);
        onClipSaved?.();
      } catch (err) {
        console.error("Failed to save clip:", err);
      }
    };

    saveClip();
  }, [isNewVideo, videoUrl, imageUrl, prompt, duration, aspectRatio, onClipSaved]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(videoUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Video */}
      <div className="rounded-xl overflow-hidden bg-black">
        <video
          src={videoUrl}
          controls
          autoPlay
          loop
          className="w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-background font-medium hover:bg-accent-hover disabled:opacity-40 transition-colors"
        >
          {isDownloading ? (
            <>
              <Spinner size="sm" className="text-background" />
              Downloading...
            </>
          ) : (
            <>
              <DownloadIcon />
              Download
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-hover text-foreground font-medium hover:bg-surface-elevated transition-colors"
        >
          <PlusIcon />
          Create New
        </button>
      </div>

      {saved && (
        <p className="text-xs text-accent text-center flex items-center justify-center gap-1">
          <CheckIcon />
          Saved to your clips
        </p>
      )}
    </div>
  );
}
