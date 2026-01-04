import { NextRequest, NextResponse } from "next/server";
import { deleteClip, getClip } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clip = getClip(id);

    if (!clip) {
      return NextResponse.json(
        { error: "Clip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ clip });
  } catch (error) {
    console.error("Failed to fetch clip:", error);
    return NextResponse.json(
      { error: "Failed to fetch clip" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteClip(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Clip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete clip:", error);
    return NextResponse.json(
      { error: "Failed to delete clip" },
      { status: 500 }
    );
  }
}
