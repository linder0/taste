import Database from "better-sqlite3";
import path from "path";
import type { Clip, Project } from "@/types/project";

export type { Clip, Project };

const dbPath = path.join(process.cwd(), "data", "projects.db");
const db = new Database(dbPath);

// Migration: rename projects table to clips if needed
const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'").get();
if (tableInfo) {
  // Check if clips table already exists
  const clipsExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='clips'").get();
  if (!clipsExists) {
    db.exec("ALTER TABLE projects RENAME TO clips");
  }
}

// Initialize clips schema (formerly projects)
db.exec(`
  CREATE TABLE IF NOT EXISTS clips (
    id TEXT PRIMARY KEY,
    video_url TEXT NOT NULL,
    image_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    duration INTEGER NOT NULL,
    aspect_ratio TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    project_id TEXT
  )
`);

// Add project_id column if it doesn't exist (for migration)
try {
  db.exec("ALTER TABLE clips ADD COLUMN project_id TEXT");
} catch {
  // Column already exists, ignore
}

// Initialize projects schema (new container/workspace)
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

// ============ Clips (generated media) ============

export function getAllClips(): Clip[] {
  return db.prepare("SELECT * FROM clips ORDER BY created_at DESC").all() as Clip[];
}

export function getClip(id: string): Clip | undefined {
  return db.prepare("SELECT * FROM clips WHERE id = ?").get(id) as Clip | undefined;
}

export function getClipsByProject(projectId: string): Clip[] {
  return db.prepare("SELECT * FROM clips WHERE project_id = ? ORDER BY created_at DESC").all(projectId) as Clip[];
}

export function createClip(clip: Clip): void {
  db.prepare(`
    INSERT INTO clips (id, video_url, image_url, prompt, duration, aspect_ratio, created_at, project_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    clip.id,
    clip.video_url,
    clip.image_url,
    clip.prompt,
    clip.duration,
    clip.aspect_ratio,
    clip.created_at,
    clip.project_id || null
  );
}

export function deleteClip(id: string): boolean {
  const result = db.prepare("DELETE FROM clips WHERE id = ?").run(id);
  return result.changes > 0;
}

// ============ Projects (containers/workspaces) ============

export function getAllProjects(): Project[] {
  return db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as Project[];
}

export function getProject(id: string): Project | undefined {
  return db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project | undefined;
}

export function createProject(project: Project): void {
  db.prepare(`
    INSERT INTO projects (id, name, thumbnail_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    project.id,
    project.name,
    project.thumbnail_url || null,
    project.created_at,
    project.updated_at
  );
}

export function updateProject(id: string, updates: Partial<Pick<Project, "name" | "thumbnail_url">>): boolean {
  const project = getProject(id);
  if (!project) return false;

  db.prepare(`
    UPDATE projects SET name = ?, thumbnail_url = ?, updated_at = ? WHERE id = ?
  `).run(
    updates.name ?? project.name,
    updates.thumbnail_url ?? project.thumbnail_url,
    Date.now(),
    id
  );
  return true;
}

export function deleteProject(id: string): boolean {
  // Also delete associated clips
  db.prepare("DELETE FROM clips WHERE project_id = ?").run(id);
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}
