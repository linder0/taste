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
  parent_variation_id?: string; // forked from (null = from original)
  video_url: string;
  image_url: string;
  prompt: string;
  duration: number;
  aspect_ratio: string;
  created_at: number;
}

// Lightweight timestamp tag for marking issues
export interface ClipTag {
  id: string;
  clip_id: string;
  variation_id?: string; // null = original clip
  timestamp: number;
  content: string;
  created_at: number;
}
