"use client";

import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project.id);
  };

  return (
    <div
      onClick={() => onClick?.(project)}
      className="group cursor-pointer rounded-xl overflow-hidden bg-surface hover:bg-surface-hover transition-all"
    >
      <div className="relative aspect-video bg-surface-elevated flex items-center justify-center">
        {project.thumbnail_url ? (
          <img
            src={project.thumbnail_url}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <span className="text-xs">No preview</span>
          </div>
        )}
        {/* Delete button */}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/60 rounded-lg text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm text-foreground truncate font-medium">
          {project.name}
        </p>
        <p className="text-xs text-muted mt-1">
          Updated {new Date(project.updated_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

// Empty state card for creating new projects
export function NewProjectCard({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl overflow-hidden bg-surface hover:bg-surface-hover border-2 border-dashed border-border hover:border-accent transition-all"
    >
      <div className="aspect-video flex flex-col items-center justify-center gap-2 text-muted hover:text-accent transition-colors">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-sm font-medium">New Project</span>
      </div>
    </div>
  );
}

