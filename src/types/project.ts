// Clip: Individual generated media (video, future: image)
export interface Clip {
  id: string;
  video_url: string;
  image_url: string;
  prompt: string;
  duration: number;
  aspect_ratio: string;
  created_at: number;
}

// Timeline marker for clip editor
export interface ClipTimeline {
  id: string;
  clip_id: string;
  timestamp: number; // seconds
  type: "keyframe" | "note" | "segment_start" | "segment_end";
  content: string; // prompt or note text
  created_at: number;
}

// Variation of a clip with different prompt
export interface ClipVariation {
  id: string;
  parent_clip_id: string;
  video_url: string;
  image_url: string;
  prompt: string;
  duration: number;
  aspect_ratio: string;
  created_at: number;
}
