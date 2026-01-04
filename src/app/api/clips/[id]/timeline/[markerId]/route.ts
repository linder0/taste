import { NextRequest, NextResponse } from "next/server";
import { deleteTimelineMarker } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; markerId: string }> }
) {
  try {
    const { markerId } = await params;
    const deleted = deleteTimelineMarker(markerId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Marker not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete marker:", error);
    return NextResponse.json(
      { error: "Failed to delete marker" },
      { status: 500 }
    );
  }
}
