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
