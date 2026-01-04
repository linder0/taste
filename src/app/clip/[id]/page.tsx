"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { VideoScrubber } from "@/components/VideoScrubber";
import { Sidebar } from "@/components/Sidebar";
import { Spinner, PlayIcon } from "@/components/ui";
import type { Clip, ClipVariation } from "@/types/project";

interface ClipEditorPageProps {
  params: Promise<{ id: string }>;
}

export default function ClipEditorPage({ params }: ClipEditorPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clip, setClip] = useState<Clip | null>(null);
  const [variations, setVariations] = useState<ClipVariation[]>([]);
  const [loading, setLoading] = useState(true);

  // Variation generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [variationPrompt, setVariationPrompt] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0); // 0 = original, 1+ = variations

  useEffect(() => {
    fetchClipData();
  }, [id]);

  const fetchClipData = async () => {
    try {
      const [clipRes, variationsRes] = await Promise.all([
        fetch(`/api/clips/${id}`),
        fetch(`/api/clips/${id}/variations`),
      ]);

      if (!clipRes.ok) {
        router.push("/");
        return;
      }

      const clipData = await clipRes.json();
      const variationsData = await variationsRes.json();

      setClip(clipData.clip);
      setVariations(variationsData.variations || []);
      setVariationPrompt(clipData.clip.prompt);
    } catch (err) {
      console.error("Failed to fetch clip:", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariation = async () => {
    if (!clip || !variationPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`/api/clips/${id}/variations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: variationPrompt.trim(),
        }),
      });

      const data = await res.json();
      if (data.taskId) {
        pollVariation(data.taskId);
      }
    } catch (err) {
      console.error("Failed to create variation:", err);
      setIsGenerating(false);
    }
  };

  const pollVariation = async (taskId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${taskId}`);
        const data = await res.json();

        if (data.status === "completed" && data.videoUrl) {
          const saveRes = await fetch(`/api/clips/${id}/variations`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoUrl: data.videoUrl,
              prompt: variationPrompt.trim(),
            }),
          });
          const saveData = await saveRes.json();
          if (saveData.variation) {
            setVariations((prev) => [saveData.variation, ...prev]);
            setSelectedIndex(1); // Select the new variation
          }
          setIsGenerating(false);
        } else if (data.status === "failed") {
          console.error("Variation failed:", data.error);
          setIsGenerating(false);
        } else {
          setTimeout(poll, 3000);
        }
      } catch (err) {
        console.error("Poll error:", err);
        setIsGenerating(false);
      }
    };

    poll();
  };

  const handleDeleteClip = async () => {
    if (!confirm("Delete this clip and all its variations?")) return;
    try {
      await fetch(`/api/clips/${id}`, { method: "DELETE" });
      router.push("/");
    } catch (err) {
      console.error("Failed to delete clip:", err);
    }
  };

  // Get all items for the grid (original + variations)
  const allItems = clip ? [
    { id: "original", video_url: clip.video_url, prompt: clip.prompt, duration: clip.duration, isOriginal: true },
    ...variations.map((v) => ({ ...v, isOriginal: false })),
  ] : [];

  const selectedItem = allItems[selectedIndex];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (!clip) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="flex-shrink-0 bg-background border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => router.push("/")}
            className="text-sm font-semibold text-foreground flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center">
              <PlayIcon className="w-3 h-3 text-accent" />
            </span>
            VideoGen
          </button>
          <span className="text-muted text-sm">/</span>
          <span className="text-foreground text-sm font-medium">Compare</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {variations.length + 1} version{variations.length !== 0 ? "s" : ""}
          </span>
          <button
            onClick={handleDeleteClip}
            className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left - Main Video View */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Selected Video */}
          <div className="flex-1 min-h-0">
            {selectedItem && (
              <VideoScrubber
                src={selectedItem.video_url}
                duration={selectedItem.duration}
              />
            )}
          </div>

          {/* Selected Info */}
          {selectedItem && (
            <div className="mt-3 flex-shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded ${selectedItem.isOriginal ? "bg-accent/20 text-accent" : "bg-surface-elevated text-muted"}`}>
                  {selectedItem.isOriginal ? "Original" : `Variation ${selectedIndex}`}
                </span>
              </div>
              <p className="text-sm text-foreground line-clamp-2">{selectedItem.prompt}</p>
            </div>
          )}
        </div>

        {/* Right - Sidebar */}
        <div className="w-80 flex-shrink-0 border-l border-border flex flex-col overflow-hidden">
          {/* Input Image */}
          <div className="p-3 border-b border-border flex-shrink-0">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Source</h3>
            <div className="rounded-lg overflow-hidden bg-surface-elevated">
              <img src={clip.image_url} alt="" className="w-full aspect-video object-contain" />
            </div>
          </div>

          {/* New Variation */}
          <div className="p-3 border-b border-border flex-shrink-0">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">New Variation</h3>
            <textarea
              value={variationPrompt}
              onChange={(e) => setVariationPrompt(e.target.value)}
              className="w-full bg-surface rounded-lg p-2 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent text-xs"
              rows={2}
              placeholder="Edit prompt..."
            />
            <button
              onClick={handleCreateVariation}
              disabled={isGenerating || !variationPrompt.trim()}
              className="w-full mt-2 py-2 rounded-lg bg-accent text-background text-xs font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Spinner size="xs" className="text-background" />
                  Generating...
                </>
              ) : (
                "Generate Variation"
              )}
            </button>
          </div>

          {/* All Versions */}
          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">All Versions</h3>
            <div className="space-y-2">
              {allItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full rounded-lg overflow-hidden border-2 transition-all ${
                    selectedIndex === index
                      ? "border-accent"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <div className="relative aspect-video bg-surface-elevated">
                    <video
                      src={item.video_url}
                      className="w-full h-full object-cover"
                      muted
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                    <div className="absolute top-1 left-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${item.isOriginal ? "bg-accent text-background" : "bg-black/60 text-white"}`}>
                        {item.isOriginal ? "Original" : `V${index}`}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-surface text-left">
                    <p className="text-xs text-foreground line-clamp-1">{item.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
