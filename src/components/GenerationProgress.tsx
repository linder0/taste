"use client";

import { useEffect, useState } from "react";
import { PlayIcon } from "@/components/ui";

interface GenerationProgressProps {
  taskId: string;
  onComplete: (videoUrl: string) => void;
  onError: (error: string) => void;
}

export function GenerationProgress({ taskId, onComplete, onError }: GenerationProgressProps) {
  const [status, setStatus] = useState<string>("pending");
  const [progress, setProgress] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;
    const startTime = Date.now();

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/status/${taskId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to check status");
        }

        setStatus(data.status);
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }

        if (data.status === "completed" && data.videoUrl) {
          clearInterval(pollInterval);
          clearInterval(timeInterval);
          onComplete(data.videoUrl);
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          clearInterval(timeInterval);
          onError(data.error || "Generation failed");
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    };

    pollStatus();
    pollInterval = setInterval(pollStatus, 5000);

    timeInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, [taskId, onComplete, onError]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Animated spinner */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center">
          <PlayIcon className="w-8 h-8 text-accent" />
        </div>
        <div className="absolute inset-0 rounded-full border-3 border-border border-t-accent animate-spin" />
      </div>

      <div className="text-center space-y-1">
        <p className="text-lg font-medium text-foreground">
          {status === "pending" ? "Queued for processing..." : "Generating your video..."}
        </p>
        <p className="text-sm text-muted">
          Elapsed: {formatTime(elapsedTime)}
        </p>
      </div>

      {/* Progress bar */}
      {status === "processing" && (
        <div className="w-48">
          <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
          {progress > 0 && (
            <p className="text-center text-sm text-muted mt-2">{progress}%</p>
          )}
        </div>
      )}

      <p className="text-xs text-muted">
        Turbo mode: ~30-60s • Quality mode: ~2-5min
      </p>
    </div>
  );
}
