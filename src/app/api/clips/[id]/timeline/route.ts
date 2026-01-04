import { NextRequest, NextResponse } from "next/server";
import { getClipTimeline, createTimelineMarker, ClipTimeline } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const timeline = getClipTimeline(id);
    return NextResponse.json({ timeline });
  } catch (error) {
    console.error("Failed to fetch timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { timestamp, type, content } = body;

    if (timestamp === undefined || !type || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const marker: ClipTimeline = {
      id: crypto.randomUUID(),
      clip_id: id,
      timestamp,
      type,
      content,
      created_at: Date.now(),
    };

    createTimelineMarker(marker);

    return NextResponse.json({ marker });
  } catch (error) {
    console.error("Failed to create timeline marker:", error);
    return NextResponse.json(
      { error: "Failed to create timeline marker" },
      { status: 500 }
    );
  }
}
