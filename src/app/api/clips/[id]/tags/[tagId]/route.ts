import { NextRequest, NextResponse } from "next/server";
import { deleteClipTag } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const { tagId } = await params;
    const deleted = deleteClipTag(tagId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}

