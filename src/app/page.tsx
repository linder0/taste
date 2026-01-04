"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClipCard } from "@/components/ClipCard";
import { Sidebar } from "@/components/Sidebar";
import { Spinner, PlayIcon, MenuIcon } from "@/components/ui";
import type { Clip } from "@/types/project";

export default function Home() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClips();
  }, []);

  const fetchClips = async () => {
    try {
      const res = await fetch("/api/clips");
      const data = await res.json();
      setClips(data.clips || []);
    } catch (err) {
      console.error("Failed to fetch clips:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClipClick = (clip: Clip) => {
    router.push(`/clip/${clip.id}`);
  };

  const handleDeleteClip = async (id: string) => {
    try {
      await fetch(`/api/clips/${id}`, { method: "DELETE" });
      setClips((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete clip:", err);
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors"
        >
          <MenuIcon />
        </button>
        <div className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center">
            <PlayIcon className="w-3.5 h-3.5 text-accent" />
          </span>
          VideoGen
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Hero - Create CTA */}
        <section className="mb-10">
          <button
            onClick={() => router.push("/create")}
            className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-surface to-surface-elevated border border-accent/30 hover:border-accent/50 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
                  Create New Video
                </h2>
                <p className="text-muted text-sm">
                  Transform your images into animated videos with AI
                </p>
              </div>
            </div>
          </button>
        </section>

        {/* Quick Actions */}
        <section className="mb-10">
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
            Quick Actions
          </h3>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => router.push("/create")}
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-surface hover:bg-surface-hover border border-border hover:border-accent/50 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">AI Video</p>
                <p className="text-xs text-muted">Image to video</p>
              </div>
            </button>
            <button
              disabled
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-surface border border-border opacity-50 cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center">
                <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">AI Image</p>
                <p className="text-xs text-muted">Coming soon</p>
              </div>
            </button>
          </div>
        </section>

        {/* Clips */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Your Clips
            </h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" className="text-accent" />
            </div>
          ) : clips.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-surface">
              <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-foreground font-medium mb-1">No clips yet</p>
              <p className="text-muted text-sm mb-4">Create your first AI-generated video</p>
              <button
                onClick={() => router.push("/create")}
                className="px-6 py-2 rounded-lg bg-accent text-background font-medium hover:bg-accent-hover transition-colors"
              >
                Create Video
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {clips.map((clip) => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  onClick={handleClipClick}
                  onDelete={handleDeleteClip}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
