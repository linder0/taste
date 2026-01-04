import { NextRequest, NextResponse } from "next/server";
import { getTaskStatus } from "@/lib/piapi";

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { taskId } = await context.params;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const status = await getTaskStatus(taskId);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("Status check error:", error);
    const message = error instanceof Error ? error.message : "Failed to check task status";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
