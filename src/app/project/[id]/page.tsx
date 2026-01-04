"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ClipCard } from "@/components/ClipCard";
import { Sidebar } from "@/components/Sidebar";
import { Spinner, PlayIcon } from "@/components/ui";
import type { Clip, Project } from "@/types/project";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setProject(data.project);
      setClips(data.clips || []);
      setEditName(data.project.name);
    } catch (err) {
      console.error("Failed to fetch project:", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editName.trim() || !project) return;
    try {
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      setProject({ ...project, name: editName.trim() });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update project:", err);
    }
  };

  const handleDeleteClip = async (clipId: string) => {
    try {
      await fetch(`/api/clips/${clipId}`, { method: "DELETE" });
      setClips((prev) => prev.filter((c) => c.id !== clipId));
    } catch (err) {
      console.error("Failed to delete clip:", err);
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

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

      <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Project Header */}
        <div className="mb-8">
          {isEditing ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdateName()}
                className="text-2xl font-semibold bg-transparent border-b-2 border-accent text-foreground focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleUpdateName}
                className="px-3 py-1 text-sm bg-accent text-background rounded-lg hover:bg-accent-hover transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditName(project.name);
                }}
                className="px-3 py-1 text-sm text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1
              onClick={() => setIsEditing(true)}
              className="text-2xl font-semibold text-foreground cursor-pointer hover:text-accent transition-colors inline-flex items-center gap-2"
            >
              {project.name}
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </h1>
          )}
          <p className="text-muted text-sm mt-1">
            Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Editor Placeholder */}
        <div className="rounded-2xl bg-surface border border-border p-8 sm:p-12 mb-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-surface-elevated flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Video Editor Coming Soon
            </h2>
            <p className="text-muted text-sm max-w-md mx-auto mb-6">
              This is where you&apos;ll be able to arrange clips on a timeline, add transitions, and create full video projects.
            </p>
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-2.5 rounded-xl bg-accent text-background font-medium hover:bg-accent-hover transition-colors"
            >
              Create New Clip
            </button>
          </div>
        </div>

        {/* Project Clips */}
        <section>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
            Clips in This Project
          </h3>
          {clips.length === 0 ? (
            <div className="text-center py-8 rounded-xl bg-surface">
              <p className="text-muted text-sm">No clips in this project yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {clips.map((clip) => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
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

