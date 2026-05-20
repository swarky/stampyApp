import * as SQLite from 'expo-sqlite';
import { Stamp, Category, CalendarEntry } from '../types';

const db = SQLite.openDatabaseSync('stampapp.db');

// ─── Schema ───────────────────────────────────────────────────────────────────
export function initDb() {
  // Create tables if they don't exist yet
  db.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS stamps (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      imageUri   TEXT    NOT NULL,
      name       TEXT    NOT NULL,
      note       TEXT    DEFAULT '',
      date       TEXT    NOT NULL,
      categoryId INTEGER REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS calendar (
      date    TEXT    PRIMARY KEY,
      stampId INTEGER NOT NULL REFERENCES stamps(id)
    );
  `);

  // ── Schema migrations ──────────────────────────────────────────────────────
  // Safely add new columns; SQLite throws if a column already exists, so we
  // catch and ignore those errors (idempotent migration).
  try { db.runSync("ALTER TABLE stamps ADD COLUMN filter TEXT DEFAULT 'original'"); } catch {}
  try { db.runSync("ALTER TABLE stamps ADD COLUMN shape  TEXT DEFAULT 'square'");   } catch {}
}

// ─── Categories ───────────────────────────────────────────────────────────────
export function getCategories(): Category[] {
  return db.getAllSync<Category>('SELECT * FROM categories ORDER BY name');
}

export function addCategory(name: string): number {
  const result = db.runSync('INSERT INTO categories (name) VALUES (?)', [name]);
  return result.lastInsertRowId;
}

export function updateCategory(id: number, name: string) {
  db.runSync('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
}

export function deleteCategory(id: number) {
  // Detach stamps from this category before deleting
  db.runSync('UPDATE stamps SET categoryId = NULL WHERE categoryId = ?', [id]);
  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
}

// ─── Stamps ───────────────────────────────────────────────────────────────────
export function getStamps(): Stamp[] {
  return db.getAllSync<Stamp>('SELECT * FROM stamps ORDER BY date DESC');
}

export function getStampsByCategory(categoryId: number): Stamp[] {
  return db.getAllSync<Stamp>(
    'SELECT * FROM stamps WHERE categoryId = ? ORDER BY date DESC',
    [categoryId],
  );
}

export function getStampById(id: number): Stamp | null {
  return db.getFirstSync<Stamp>('SELECT * FROM stamps WHERE id = ?', [id]);
}

export function addStamp(stamp: Omit<Stamp, 'id'>): number {
  const result = db.runSync(
    'INSERT INTO stamps (imageUri, name, note, date, categoryId, filter, shape) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [stamp.imageUri, stamp.name, stamp.note, stamp.date,
     stamp.categoryId ?? null, stamp.filter, stamp.shape],
  );
  return result.lastInsertRowId;
}

export function updateStamp(id: number, name: string, note: string, categoryId: number | null) {
  db.runSync(
    'UPDATE stamps SET name = ?, note = ?, categoryId = ? WHERE id = ?',
    [name, note, categoryId ?? null, id],
  );
}

export function deleteStamp(id: number) {
  // Remove calendar entries referencing this stamp, then delete it
  db.runSync('DELETE FROM calendar WHERE stampId = ?', [id]);
  db.runSync('DELETE FROM stamps WHERE id = ?', [id]);
}

// ─── Favourites ───────────────────────────────────────────────────────────────
// Stored as a separate table so we can query efficiently without touching stamps
export function initFavourites() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS favourites (
      stampId INTEGER PRIMARY KEY REFERENCES stamps(id)
    );
  `);
}

export function getFavouriteIds(): Set<number> {
  const rows = db.getAllSync<{ stampId: number }>('SELECT stampId FROM favourites');
  return new Set(rows.map(r => r.stampId));
}

export function toggleFavourite(stampId: number, isFav: boolean) {
  if (isFav) {
    db.runSync('INSERT OR IGNORE INTO favourites (stampId) VALUES (?)', [stampId]);
  } else {
    db.runSync('DELETE FROM favourites WHERE stampId = ?', [stampId]);
  }
}

export function isFavourite(stampId: number): boolean {
  const row = db.getFirstSync<{ stampId: number }>(
    'SELECT stampId FROM favourites WHERE stampId = ?', [stampId],
  );
  return row != null;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
export function getCalendarEntries(): CalendarEntry[] {
  return db.getAllSync<CalendarEntry>('SELECT * FROM calendar');
}

export function setCalendarEntry(date: string, stampId: number) {
  db.runSync(
    'INSERT OR REPLACE INTO calendar (date, stampId) VALUES (?, ?)',
    [date, stampId],
  );
}

export function getCalendarEntry(date: string): CalendarEntry | null {
  return db.getFirstSync<CalendarEntry>('SELECT * FROM calendar WHERE date = ?', [date]);
}
