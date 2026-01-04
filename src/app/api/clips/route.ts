import { NextRequest, NextResponse } from "next/server";
import { getAllClips, createClip, Clip } from "@/lib/db";

export async function GET() {
  try {
    const clips = getAllClips();
    return NextResponse.json({ clips });
  } catch (error) {
    console.error("Failed to fetch clips:", error);
    return NextResponse.json(
      { error: "Failed to fetch clips" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { videoUrl, imageUrl, prompt, duration, aspectRatio } = body;

    if (!videoUrl || !imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const clip: Clip = {
      id: crypto.randomUUID(),
      video_url: videoUrl,
      image_url: imageUrl,
      prompt,
      duration: duration || 5,
      aspect_ratio: aspectRatio || "16:9",
      created_at: Date.now(),
    };

    createClip(clip);

    return NextResponse.json({ clip });
  } catch (error) {
    console.error("Failed to save clip:", error);
    return NextResponse.json(
      { error: "Failed to save clip" },
      { status: 500 }
    );
  }
}
