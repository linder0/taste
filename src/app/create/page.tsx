"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ImageInput } from "@/components/ImageInput";
import { PromptEditor } from "@/components/PromptEditor";
import { VideoSettings, SpeedMode } from "@/components/VideoSettings";
import { GenerationProgress } from "@/components/GenerationProgress";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Sidebar } from "@/components/Sidebar";
import { Spinner, PlayIcon, ErrorAlert } from "@/components/ui";

type CreateState = "input" | "generating" | "complete";

export default function CreatePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [state, setState] = useState<CreateState>("input");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [duration, setDuration] = useState<2 | 5 | 10>(2);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [speedMode, setSpeedMode] = useState<SpeedMode>("turbo");
  const [taskId, setTaskId] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!imageUrl || !prompt.trim()) {
      setError("Please provide an image and prompt");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          prompt: prompt.trim(),
          duration,
          aspectRatio,
          mode: speedMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start generation");
      }

      setTaskId(data.taskId);
      setState("generating");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start generation");
    } finally {
      setIsSubmitting(false);
    }
  }, [imageUrl, prompt, duration, aspectRatio, speedMode]);

  const handleComplete = useCallback((url: string) => {
    setVideoUrl(url);
    setState("complete");
  }, []);

  const handleError = useCallback((errMessage: string) => {
    setError(errMessage);
    setState("input");
  }, []);

  const handleReset = useCallback(() => {
    setState("input");
    setImageUrl("");
    setPrompt("");
    setTaskId("");
    setVideoUrl("");
    setError("");
  }, []);

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const isFormValid = imageUrl && prompt.trim().length > 0;

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={handleGoHome}
          className="text-lg font-semibold text-foreground flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center">
            <PlayIcon className="w-3.5 h-3.5 text-accent" />
          </span>
          VideoGen
        </button>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              {state === "complete" ? "Video Complete" : "Create New Video"}
            </h1>
            <p className="text-muted text-sm mt-1">
              {state === "complete"
                ? "Your video is ready to download"
                : "Transform your image into an animated video"}
            </p>
          </div>

          {state === "input" && (
            <div className="space-y-5">
              {/* Create Card */}
              <div className="rounded-xl bg-surface p-4 sm:p-6">
                <ImageInput onImageSelect={setImageUrl} disabled={isSubmitting} />

                {imageUrl && (
                  <div className="mt-5 space-y-4">
                    <PromptEditor
                      value={prompt}
                      onChange={setPrompt}
                      imageUrl={imageUrl}
                      disabled={isSubmitting}
                    />

                    <VideoSettings
                      duration={duration}
                      aspectRatio={aspectRatio}
                      speedMode={speedMode}
                      onDurationChange={setDuration}
                      onAspectRatioChange={setAspectRatio}
                      onSpeedModeChange={setSpeedMode}
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>

              {error && <ErrorAlert>{error}</ErrorAlert>}

              {imageUrl && prompt.trim() && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!isFormValid || isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size="sm" className="text-background" />
                      Starting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <PlayIcon className="w-5 h-5" />
                      Generate Video
                    </span>
                  )}
                </button>
              )}
            </div>
          )}

          {state === "generating" && taskId && (
            <div className="rounded-xl bg-surface p-6 sm:p-8">
              <GenerationProgress
                taskId={taskId}
                onComplete={handleComplete}
                onError={handleError}
              />
            </div>
          )}

          {state === "complete" && videoUrl && (
            <div className="rounded-xl bg-surface p-4 sm:p-6">
              <VideoPlayer
                videoUrl={videoUrl}
                imageUrl={imageUrl}
                prompt={prompt}
                duration={duration}
                aspectRatio={aspectRatio}
                onReset={handleReset}
                isNewVideo={true}
                onClipSaved={handleGoHome}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

