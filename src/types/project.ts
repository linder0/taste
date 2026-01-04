// Clip: Individual generated media (video, future: image)
export interface Clip {
  id: string;
  video_url: string;
  image_url: string;
  prompt: string;
  duration: number;
  aspect_ratio: string;
  created_at: number;
  project_id?: string | null;
}

// Project: Container/workspace, future video editor
export interface Project {
  id: string;
  name: string;
  thumbnail_url?: string | null;
  created_at: number;
  updated_at: number;
}

// Legacy alias for backwards compatibility during migration
export type { Clip as LegacyProject };
