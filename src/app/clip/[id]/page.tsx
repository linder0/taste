"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { VideoScrubber } from "@/components/VideoScrubber";
import { Sidebar } from "@/components/Sidebar";
import { PromptHistory } from "@/components/PromptHistory";
import { Spinner, PlayIcon } from "@/components/ui";
import type { Clip, ClipVariation, ClipTag } from "@/types/project";

interface ClipEditorPageProps {
  params: Promise<{ id: string }>;
}

export default function ClipEditorPage({ params }: ClipEditorPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clip, setClip] = useState<Clip | null>(null);
  const [variations, setVariations] = useState<ClipVariation[]>([]);
  const [tags, setTags] = useState<ClipTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Variation generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [variationPrompt, setVariationPrompt] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0); // 0 = original, 1+ = variations

  // Tag creation state
  const [pendingTagTimestamp, setPendingTagTimestamp] = useState<number | null>(null);
  const [tagContent, setTagContent] = useState("");

  // AI suggestion state
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    fetchClipData();
  }, [id]);

  const fetchClipData = async () => {
    try {
      const [clipRes, variationsRes, tagsRes] = await Promise.all([
        fetch(`/api/clips/${id}`),
        fetch(`/api/clips/${id}/variations`),
        fetch(`/api/clips/${id}/tags`),
      ]);

      if (!clipRes.ok) {
        router.push("/");
        return;
      }

      const clipData = await clipRes.json();
      const variationsData = await variationsRes.json();
      const tagsData = await tagsRes.json();

      setClip(clipData.clip);
      setVariations(variationsData.variations || []);
      setTags(tagsData.tags || []);
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

    // Determine if forking from a variation
    const parentVariationId = selectedIndex > 0 ? variations[selectedIndex - 1]?.id : undefined;

    setIsGenerating(true);
    try {
      const res = await fetch(`/api/clips/${id}/variations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: variationPrompt.trim(),
          parentVariationId,
        }),
      });

      const data = await res.json();
      if (data.taskId) {
        pollVariation(data.taskId, data.parentVariationId);
      }
    } catch (err) {
      console.error("Failed to create variation:", err);
      setIsGenerating(false);
    }
  };

  const pollVariation = async (taskId: string, parentVariationId?: string) => {
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
              parentVariationId,
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

  const handleAddTag = (timestamp: number) => {
    setPendingTagTimestamp(timestamp);
    setTagContent("");
  };

  const handleSaveTag = async () => {
    if (pendingTagTimestamp === null || !tagContent.trim()) return;
    
    try {
      const selectedVariation = selectedIndex > 0 ? variations[selectedIndex - 1] : null;
      const res = await fetch(`/api/clips/${id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: pendingTagTimestamp,
          content: tagContent.trim(),
          variationId: selectedVariation?.id,
        }),
      });
      const data = await res.json();
      if (data.tag) {
        setTags((prev) => [...prev, data.tag].sort((a, b) => a.timestamp - b.timestamp));
      }
    } catch (err) {
      console.error("Failed to create tag:", err);
    } finally {
      setPendingTagTimestamp(null);
      setTagContent("");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await fetch(`/api/clips/${id}/tags/${tagId}`, { method: "DELETE" });
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (err) {
      console.error("Failed to delete tag:", err);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const handleSuggestPrompt = async () => {
    if (!clip || isSuggesting) return;

    const selectedVariationId = selectedIndex > 0 ? variations[selectedIndex - 1]?.id : undefined;

    setIsSuggesting(true);
    try {
      const res = await fetch(`/api/clips/${id}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPrompt: variationPrompt,
          variationId: selectedVariationId,
        }),
      });

      const data = await res.json();
      if (data.suggestion) {
        setVariationPrompt(data.suggestion);
      }
    } catch (err) {
      console.error("Failed to get suggestion:", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Filter tags for current selection
  const currentTags = selectedIndex === 0
    ? tags.filter((t) => !t.variation_id)
    : tags.filter((t) => t.variation_id === variations[selectedIndex - 1]?.id);

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
                tags={currentTags}
                onAddTag={handleAddTag}
                onTagClick={(tag) => {
                  // Could seek to tag timestamp in the future
                  console.log("Tag clicked:", tag);
                }}
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
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSuggestPrompt}
                disabled={isSuggesting || isGenerating}
                className="flex-1 py-2 rounded-lg bg-surface border border-border text-foreground text-xs font-medium hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                {isSuggesting ? (
                  <>
                    <Spinner size="xs" className="text-foreground" />
                    <span>...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span>Suggest</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCreateVariation}
                disabled={isGenerating || !variationPrompt.trim()}
                className="flex-1 py-2 rounded-lg bg-accent text-background text-xs font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Spinner size="xs" className="text-background" />
                    <span>...</span>
                  </>
                ) : (
                  "Generate"
                )}
              </button>
            </div>
            {currentTags.length > 0 && (
              <p className="text-[10px] text-muted mt-1.5">
                AI will consider {currentTags.length} tag{currentTags.length !== 1 ? "s" : ""} when suggesting
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="p-3 border-b border-border flex-shrink-0">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Tags {currentTags.length > 0 && `(${currentTags.length})`}
            </h3>
            {pendingTagTimestamp !== null && (
              <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-400 mb-1">Tag @ {formatTime(pendingTagTimestamp)}</p>
                <input
                  type="text"
                  value={tagContent}
                  onChange={(e) => setTagContent(e.target.value)}
                  placeholder="What's wrong here?"
                  className="w-full bg-surface rounded p-1.5 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTag();
                    if (e.key === "Escape") setPendingTagTimestamp(null);
                  }}
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={handleSaveTag}
                    disabled={!tagContent.trim()}
                    className="flex-1 py-1 text-xs bg-amber-500 text-black rounded hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setPendingTagTimestamp(null)}
                    className="px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {currentTags.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {currentTags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-2 group">
                    <span className="text-xs text-amber-400 font-mono w-12 flex-shrink-0">
                      {formatTime(tag.timestamp)}
                    </span>
                    <span className="text-xs text-foreground flex-1 truncate">{tag.content}</span>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">Click "+ Tag" below video to mark issues</p>
            )}
          </div>

          {/* History Tree */}
          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">History</h3>
            <PromptHistory
              clip={clip}
              variations={variations}
              selectedId={selectedItem?.id === "original" ? clip.id : (selectedItem?.id || clip.id)}
              onSelect={(selectedId, isOriginal) => {
                if (isOriginal) {
                  setSelectedIndex(0);
                } else {
                  const varIndex = variations.findIndex((v) => v.id === selectedId);
                  if (varIndex !== -1) {
                    setSelectedIndex(varIndex + 1);
                  }
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
