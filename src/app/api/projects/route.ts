import { NextRequest, NextResponse } from "next/server";
import { getAllProjects, createProject, Project } from "@/lib/db";

export async function GET() {
  try {
    const projects = getAllProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, thumbnailUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      thumbnail_url: thumbnailUrl || null,
      created_at: now,
      updated_at: now,
    };

    createProject(project);

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
