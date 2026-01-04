import { NextRequest, NextResponse } from "next/server";
import { createImageToVideoTask } from "@/lib/piapi";

interface GenerateRequestBody {
  imageUrl: string;
  prompt: string;
  duration: 2 | 5 | 10;
  aspectRatio: "16:9" | "9:16";
  mode?: "standard" | "turbo";
  negativePrompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequestBody = await request.json();

    // Validate required fields
    if (!body.imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    if (!body.prompt || body.prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.imageUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid image URL format" },
        { status: 400 }
      );
    }

    // Validate duration
    if (body.duration !== 2 && body.duration !== 5 && body.duration !== 10) {
      return NextResponse.json(
        { error: "Duration must be 2, 5, or 10 seconds" },
        { status: 400 }
      );
    }

    // Validate aspect ratio
    if (body.aspectRatio !== "16:9" && body.aspectRatio !== "9:16") {
      return NextResponse.json(
        { error: "Aspect ratio must be 16:9 or 9:16" },
        { status: 400 }
      );
    }

    // Create task
    const result = await createImageToVideoTask({
      imageUrl: body.imageUrl,
      prompt: body.prompt.trim(),
      duration: body.duration,
      aspectRatio: body.aspectRatio,
      mode: body.mode || "turbo",
      negativePrompt: body.negativePrompt,
    });

    return NextResponse.json({
      success: true,
      taskId: result.taskId,
      status: result.status,
    });
  } catch (error) {
    console.error("Generate error:", error);
    const message = error instanceof Error ? error.message : "Failed to create generation task";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
