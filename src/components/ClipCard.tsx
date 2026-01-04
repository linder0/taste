"use client";

import type { Clip } from "@/types/project";

interface ClipCardProps {
  clip: Clip;
  onClick?: (clip: Clip) => void;
  onDelete?: (id: string) => void;
}

export function ClipCard({ clip, onClick, onDelete }: ClipCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(clip.id);
  };

  return (
    <div
      onClick={() => onClick?.(clip)}
      className="group cursor-pointer rounded-xl overflow-hidden bg-surface hover:bg-surface-hover transition-all"
    >
      <div className="relative aspect-video">
        <img
          src={clip.image_url}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
          {clip.duration}s
        </span>
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <svg className="w-5 h-5 text-background ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
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
          {clip.prompt.length > 40 ? clip.prompt.slice(0, 40) + "..." : clip.prompt}
        </p>
        <p className="text-xs text-muted mt-1">
          {new Date(clip.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
