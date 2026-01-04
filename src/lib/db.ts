import Database from "better-sqlite3";
import path from "path";
import type { Clip } from "@/types/project";

export type { Clip };

const dbPath = path.join(process.cwd(), "data", "projects.db");
const db = new Database(dbPath);

// Migration: rename projects table to clips if needed
const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'").get();
if (tableInfo) {
  const clipsExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='clips'").get();
  if (!clipsExists) {
    db.exec("ALTER TABLE projects RENAME TO clips");
  }
}

// Initialize clips schema
db.exec(`
  CREATE TABLE IF NOT EXISTS clips (
    id TEXT PRIMARY KEY,
    video_url TEXT NOT NULL,
    image_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    duration INTEGER NOT NULL,
    aspect_ratio TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

export function getAllClips(): Clip[] {
  return db.prepare("SELECT * FROM clips ORDER BY created_at DESC").all() as Clip[];
}

export function getClip(id: string): Clip | undefined {
  return db.prepare("SELECT * FROM clips WHERE id = ?").get(id) as Clip | undefined;
}

export function createClip(clip: Clip): void {
  db.prepare(`
    INSERT INTO clips (id, video_url, image_url, prompt, duration, aspect_ratio, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    clip.id,
    clip.video_url,
    clip.image_url,
    clip.prompt,
    clip.duration,
    clip.aspect_ratio,
    clip.created_at
  );
}

export function deleteClip(id: string): boolean {
  const result = db.prepare("DELETE FROM clips WHERE id = ?").run(id);
  return result.changes > 0;
}
