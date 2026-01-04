"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spinner, PlayIcon, CloseIcon, PlusIcon } from "@/components/ui";
import type { Clip, Project } from "@/types/project";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [clips, setClips] = useState<Clip[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [clipsRes, projectsRes] = await Promise.all([
        fetch("/api/clips"),
        fetch("/api/projects"),
      ]);
      const clipsData = await clipsRes.json();
      const projectsData = await projectsRes.json();
      setClips(clipsData.clips || []);
      setProjects(projectsData.projects || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClip = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/clips/${id}`, { method: "DELETE" });
      setClips((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete clip:", err);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const navigateTo = (path: string) => {
    router.push(path);
    onToggle();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-full w-72 bg-surface flex flex-col z-40 transition-transform duration-200 shadow-2xl"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* Logo/Title */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          <button
            onClick={() => navigateTo("/")}
            className="text-lg font-semibold text-foreground flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center">
              <PlayIcon className="w-4 h-4 text-accent" />
            </span>
            VideoGen
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 text-muted hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <button
            onClick={() => navigateTo("/")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/")
                ? "bg-surface-elevated text-accent"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </button>
          <button
            onClick={() => navigateTo("/create")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/create")
                ? "bg-surface-elevated text-accent"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <PlusIcon />
            Create New
          </button>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <Spinner size="md" className="text-accent mx-auto" />
            </div>
          ) : (
            <>
              {/* Projects */}
              <div className="p-3 pt-0">
                <h2 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 px-1">
                  Projects
                </h2>
                {projects.length === 0 ? (
                  <p className="text-muted text-xs text-center py-4 px-2">
                    No projects yet
                  </p>
                ) : (
                  <div className="space-y-1">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => navigateTo(`/project/${project.id}`)}
                        className="group cursor-pointer flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-hover hover:bg-surface-elevated transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
                          {project.thumbnail_url ? (
                            <img
                              src={project.thumbnail_url}
                              alt=""
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate font-medium">
                            {project.name}
                          </p>
                          <p className="text-xs text-muted">
                            {formatDate(project.updated_at)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteProject(e, project.id)}
                          className="w-6 h-6 flex items-center justify-center text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clips */}
              <div className="p-3">
                <h2 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 px-1">
                  Recent Clips
                </h2>
                {clips.length === 0 ? (
                  <p className="text-muted text-xs text-center py-4 px-2">
                    No clips yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {clips.slice(0, 5).map((clip) => (
                      <div
                        key={clip.id}
                        className="group cursor-pointer rounded-lg overflow-hidden bg-surface-hover hover:bg-surface-elevated transition-all"
                      >
                        <div className="relative aspect-video">
                          <img
                            src={clip.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
                            {clip.duration}s
                          </span>
                          <button
                            onClick={(e) => handleDeleteClip(e, clip.id)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 rounded text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            ×
                          </button>
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-foreground truncate font-medium">
                            {clip.prompt.length > 35 ? clip.prompt.slice(0, 35) + "..." : clip.prompt}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {formatDate(clip.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
