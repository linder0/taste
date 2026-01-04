import { NextRequest, NextResponse } from "next/server";
import { getClip, getClipVariations, createClipVariation, ClipVariation } from "@/lib/db";
import { createImageToVideoTask } from "@/lib/piapi";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const variations = getClipVariations(id);
    return NextResponse.json({ variations });
  } catch (error) {
    console.error("Failed to fetch variations:", error);
    return NextResponse.json(
      { error: "Failed to fetch variations" },
      { status: 500 }
    );
  }
}

// POST - Start generation of a new variation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { prompt, parentVariationId } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Get the parent clip
    const clip = getClip(id);
    if (!clip) {
      return NextResponse.json(
        { error: "Clip not found" },
        { status: 404 }
      );
    }

    // Start generation using the same image
    const result = await createImageToVideoTask({
      imageUrl: clip.image_url,
      prompt,
      duration: clip.duration as 2 | 5 | 10,
      aspectRatio: clip.aspect_ratio as "16:9" | "9:16",
      mode: "turbo",
    });

    // Return taskId and parentVariationId for tracking lineage
    return NextResponse.json({ taskId: result.taskId, parentVariationId });
  } catch (error) {
    console.error("Failed to create variation:", error);
    return NextResponse.json(
      { error: "Failed to create variation" },
      { status: 500 }
    );
  }
}

// PUT - Save a completed variation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { videoUrl, prompt, parentVariationId } = body;

    if (!videoUrl || !prompt) {
      return NextResponse.json(
        { error: "Video URL and prompt are required" },
        { status: 400 }
      );
    }

    // Get the parent clip for metadata
    const clip = getClip(id);
    if (!clip) {
      return NextResponse.json(
        { error: "Clip not found" },
        { status: 404 }
      );
    }

    const variation: ClipVariation = {
      id: crypto.randomUUID(),
      parent_clip_id: id,
      parent_variation_id: parentVariationId || undefined,
      video_url: videoUrl,
      image_url: clip.image_url,
      prompt,
      duration: clip.duration,
      aspect_ratio: clip.aspect_ratio,
      created_at: Date.now(),
    };

    createClipVariation(variation);

    return NextResponse.json({ variation });
  } catch (error) {
    console.error("Failed to save variation:", error);
    return NextResponse.json(
      { error: "Failed to save variation" },
      { status: 500 }
    );
  }
}
