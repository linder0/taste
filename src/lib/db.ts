import Database from "better-sqlite3";
import path from "path";
import type { Clip, ClipTimeline, ClipVariation } from "@/types/project";

export type { Clip, ClipTimeline, ClipVariation };

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

// Initialize timeline schema
db.exec(`
  CREATE TABLE IF NOT EXISTS clip_timeline (
    id TEXT PRIMARY KEY,
    clip_id TEXT NOT NULL,
    timestamp REAL NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE
  )
`);

// Initialize variations schema
db.exec(`
  CREATE TABLE IF NOT EXISTS clip_variations (
    id TEXT PRIMARY KEY,
    parent_clip_id TEXT NOT NULL,
    video_url TEXT NOT NULL,
    image_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    duration INTEGER NOT NULL,
    aspect_ratio TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (parent_clip_id) REFERENCES clips(id) ON DELETE CASCADE
  )
`);

// ============ Clips ============

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

// ============ Timeline ============

export function getClipTimeline(clipId: string): ClipTimeline[] {
  return db.prepare("SELECT * FROM clip_timeline WHERE clip_id = ? ORDER BY timestamp ASC").all(clipId) as ClipTimeline[];
}

export function createTimelineMarker(marker: ClipTimeline): void {
  db.prepare(`
    INSERT INTO clip_timeline (id, clip_id, timestamp, type, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    marker.id,
    marker.clip_id,
    marker.timestamp,
    marker.type,
    marker.content,
    marker.created_at
  );
}

export function deleteTimelineMarker(id: string): boolean {
  const result = db.prepare("DELETE FROM clip_timeline WHERE id = ?").run(id);
  return result.changes > 0;
}

// ============ Variations ============

export function getClipVariations(parentClipId: string): ClipVariation[] {
  return db.prepare("SELECT * FROM clip_variations WHERE parent_clip_id = ? ORDER BY created_at DESC").all(parentClipId) as ClipVariation[];
}

export function createClipVariation(variation: ClipVariation): void {
  db.prepare(`
    INSERT INTO clip_variations (id, parent_clip_id, video_url, image_url, prompt, duration, aspect_ratio, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    variation.id,
    variation.parent_clip_id,
    variation.video_url,
    variation.image_url,
    variation.prompt,
    variation.duration,
    variation.aspect_ratio,
    variation.created_at
  );
}

export function deleteClipVariation(id: string): boolean {
  const result = db.prepare("DELETE FROM clip_variations WHERE id = ?").run(id);
  return result.changes > 0;
}
