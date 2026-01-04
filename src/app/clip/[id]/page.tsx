"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { VideoScrubber } from "@/components/VideoScrubber";
import { Sidebar } from "@/components/Sidebar";
import { Spinner, PlayIcon } from "@/components/ui";
import type { Clip, ClipTimeline, ClipVariation } from "@/types/project";

interface ClipEditorPageProps {
  params: Promise<{ id: string }>;
}

type MarkerType = ClipTimeline["type"];

export default function ClipEditorPage({ params }: ClipEditorPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clip, setClip] = useState<Clip | null>(null);
  const [timeline, setTimeline] = useState<ClipTimeline[]>([]);
  const [variations, setVariations] = useState<ClipVariation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  // Variation generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [variationPrompt, setVariationPrompt] = useState("");
  const [activeVariation, setActiveVariation] = useState<ClipVariation | null>(null);

  // Add marker modal
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [markerTime, setMarkerTime] = useState(0);
  const [markerType, setMarkerType] = useState<MarkerType>("keyframe");
  const [markerContent, setMarkerContent] = useState("");

  useEffect(() => {
    fetchClipData();
  }, [id]);

  const fetchClipData = async () => {
    try {
      const [clipRes, timelineRes, variationsRes] = await Promise.all([
        fetch(`/api/clips/${id}`),
        fetch(`/api/clips/${id}/timeline`),
        fetch(`/api/clips/${id}/variations`),
      ]);

      if (!clipRes.ok) {
        router.push("/");
        return;
      }

      const clipData = await clipRes.json();
      const timelineData = await timelineRes.json();
      const variationsData = await variationsRes.json();

      setClip(clipData.clip);
      setTimeline(timelineData.timeline || []);
      setVariations(variationsData.variations || []);
      setVariationPrompt(clipData.clip.prompt);
    } catch (err) {
      console.error("Failed to fetch clip:", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMarker = (time: number) => {
    setMarkerTime(time);
    setMarkerContent("");
    setMarkerType("keyframe");
    setShowAddMarker(true);
  };

  const handleSaveMarker = async () => {
    if (!markerContent.trim()) return;

    try {
      const res = await fetch(`/api/clips/${id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: markerTime,
          type: markerType,
          content: markerContent.trim(),
        }),
      });

      const data = await res.json();
      if (data.marker) {
        setTimeline((prev) => [...prev, data.marker].sort((a, b) => a.timestamp - b.timestamp));
      }
      setShowAddMarker(false);
    } catch (err) {
      console.error("Failed to add marker:", err);
    }
  };

  const handleDeleteMarker = async (markerId: string) => {
    try {
      await fetch(`/api/clips/${id}/timeline/${markerId}`, { method: "DELETE" });
      setTimeline((prev) => prev.filter((m) => m.id !== markerId));
    } catch (err) {
      console.error("Failed to delete marker:", err);
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
            setActiveVariation(saveData.variation);
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

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (!clip) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
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
          <span className="text-foreground text-sm font-medium">Editor</span>
        </div>
        <button
          onClick={handleDeleteClip}
          className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
        >
          Delete
        </button>
      </header>

      {/* Main Content - Fixed Height */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Videos */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
            {/* Original */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex-shrink-0">Original</h3>
              <div className="flex-1 min-h-0">
                <VideoScrubber
                  src={clip.video_url}
                  duration={clip.duration}
                  markers={timeline}
                  onTimeUpdate={setCurrentTime}
                  onAddMarker={handleAddMarker}
                  compact
                />
              </div>
            </div>

            {/* Variation */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex-shrink-0">
                Variation {variations.length > 0 && `(${variations.length})`}
              </h3>
              <div className="flex-1 min-h-0">
                {isGenerating ? (
                  <div className="h-full rounded-lg bg-surface flex flex-col items-center justify-center gap-2">
                    <Spinner size="md" className="text-accent" />
                    <p className="text-muted text-xs">Generating...</p>
                  </div>
                ) : activeVariation ? (
                  <VideoScrubber
                    src={activeVariation.video_url}
                    duration={activeVariation.duration}
                    compact
                  />
                ) : (
                  <div className="h-full rounded-lg bg-surface flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-muted text-xs">Create a variation</p>
                  </div>
                )}
              </div>
              {variations.length > 1 && (
                <div className="mt-2 flex gap-1 overflow-x-auto flex-shrink-0">
                  {variations.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVariation(v)}
                      className={`flex-shrink-0 w-12 h-8 rounded overflow-hidden border-2 transition-colors ${
                        activeVariation?.id === v.id ? "border-accent" : "border-transparent hover:border-border"
                      }`}
                    >
                      <img src={v.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="w-80 flex-shrink-0 border-l border-border flex flex-col overflow-hidden">
          {/* Input Image */}
          <div className="p-3 border-b border-border flex-shrink-0">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Input</h3>
            <div className="rounded-lg overflow-hidden bg-surface-elevated">
              <img src={clip.image_url} alt="" className="w-full aspect-video object-contain" />
            </div>
          </div>

          {/* Prompt */}
          <div className="p-3 border-b border-border flex-shrink-0">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Prompt</h3>
            <textarea
              value={variationPrompt}
              onChange={(e) => setVariationPrompt(e.target.value)}
              className="w-full bg-surface rounded-lg p-2 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent text-xs"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted">
                {variationPrompt !== clip.prompt ? "Modified" : "Original"}
              </span>
              <button
                onClick={handleCreateVariation}
                disabled={isGenerating || !variationPrompt.trim()}
                className="px-3 py-1 rounded-md bg-accent text-background text-xs font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? "..." : "Generate"}
              </button>
            </div>
          </div>

          {/* Timeline Markers */}
          <div className="flex-1 flex flex-col overflow-hidden p-3">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h3 className="text-xs font-medium text-muted uppercase tracking-wider">Markers</h3>
              <button
                onClick={() => handleAddMarker(currentTime)}
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                + Add
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {timeline.length === 0 ? (
                <p className="text-muted text-xs text-center py-4">
                  Press M to add marker
                </p>
              ) : (
                <div className="space-y-1">
                  {timeline.map((marker) => (
                    <div
                      key={marker.id}
                      className="flex items-start gap-2 p-2 rounded-md bg-surface hover:bg-surface-hover transition-colors group"
                    >
                      <span className="text-xs font-mono text-accent flex-shrink-0">
                        {formatTime(marker.timestamp)}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                          marker.type === "keyframe"
                            ? "bg-accent/20 text-accent"
                            : marker.type === "note"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {marker.type === "keyframe" ? "K" : marker.type === "note" ? "N" : "S"}
                      </span>
                      <p className="flex-1 text-xs text-foreground truncate">{marker.content}</p>
                      <button
                        onClick={() => handleDeleteMarker(marker.id)}
                        className="text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Marker Modal */}
      {showAddMarker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowAddMarker(false)}>
          <div className="bg-surface rounded-xl p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Add Marker at {formatTime(markerTime)}</h3>

            <div className="space-y-3">
              <div className="flex gap-1.5 flex-wrap">
                {(["keyframe", "note", "segment_start", "segment_end"] as MarkerType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMarkerType(type)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      markerType === type
                        ? type === "keyframe"
                          ? "bg-accent text-background"
                          : type === "note"
                          ? "bg-yellow-500 text-black"
                          : "bg-blue-500 text-white"
                        : "bg-surface-hover text-muted hover:text-foreground"
                    }`}
                  >
                    {type.replace("_", " ")}
                  </button>
                ))}
              </div>

              <textarea
                value={markerContent}
                onChange={(e) => setMarkerContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-foreground placeholder:text-muted focus:border-accent focus:outline-none resize-none text-sm"
                rows={2}
                placeholder={markerType === "keyframe" ? "What should happen..." : "Note..."}
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddMarker(false)}
                  className="flex-1 py-2 rounded-lg bg-surface-hover text-foreground text-sm font-medium hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMarker}
                  disabled={!markerContent.trim()}
                  className="flex-1 py-2 rounded-lg bg-accent text-background text-sm font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
