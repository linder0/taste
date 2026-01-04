import Database from "better-sqlite3";
import path from "path";
import type { Clip, ClipTimeline, ClipVariation, ClipTag } from "@/types/project";

export type { Clip, ClipTimeline, ClipVariation, ClipTag };

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

// Migration: add parent_variation_id column to clip_variations if not exists
const variationsColumns = db.prepare("PRAGMA table_info(clip_variations)").all() as { name: string }[];
if (!variationsColumns.some(col => col.name === "parent_variation_id")) {
  db.exec("ALTER TABLE clip_variations ADD COLUMN parent_variation_id TEXT");
}

// Initialize tags schema
db.exec(`
  CREATE TABLE IF NOT EXISTS clip_tags (
    id TEXT PRIMARY KEY,
    clip_id TEXT NOT NULL,
    variation_id TEXT,
    timestamp REAL NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE,
    FOREIGN KEY (variation_id) REFERENCES clip_variations(id) ON DELETE CASCADE
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
    INSERT INTO clip_variations (id, parent_clip_id, parent_variation_id, video_url, image_url, prompt, duration, aspect_ratio, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    variation.id,
    variation.parent_clip_id,
    variation.parent_variation_id || null,
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

// ============ Tags ============

export function getClipTags(clipId: string, variationId?: string): ClipTag[] {
  if (variationId) {
    return db.prepare("SELECT * FROM clip_tags WHERE clip_id = ? AND variation_id = ? ORDER BY timestamp ASC").all(clipId, variationId) as ClipTag[];
  }
  return db.prepare("SELECT * FROM clip_tags WHERE clip_id = ? AND variation_id IS NULL ORDER BY timestamp ASC").all(clipId) as ClipTag[];
}

export function getAllClipTags(clipId: string): ClipTag[] {
  return db.prepare("SELECT * FROM clip_tags WHERE clip_id = ? ORDER BY timestamp ASC").all(clipId) as ClipTag[];
}

export function createClipTag(tag: ClipTag): void {
  db.prepare(`
    INSERT INTO clip_tags (id, clip_id, variation_id, timestamp, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    tag.id,
    tag.clip_id,
    tag.variation_id || null,
    tag.timestamp,
    tag.content,
    tag.created_at
  );
}

export function deleteClipTag(id: string): boolean {
  const result = db.prepare("DELETE FROM clip_tags WHERE id = ?").run(id);
  return result.changes > 0;
}
