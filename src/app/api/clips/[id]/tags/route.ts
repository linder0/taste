import { NextRequest, NextResponse } from "next/server";
import { getAllClipTags, createClipTag, ClipTag } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tags = getAllClipTags(id);
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
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

    const { timestamp, content, variationId } = body;

    if (timestamp === undefined || !content) {
      return NextResponse.json(
        { error: "Missing required fields: timestamp and content" },
        { status: 400 }
      );
    }

    const tag: ClipTag = {
      id: crypto.randomUUID(),
      clip_id: id,
      variation_id: variationId || undefined,
      timestamp,
      content,
      created_at: Date.now(),
    };

    createClipTag(tag);

    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Failed to create tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
