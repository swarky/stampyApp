import * as SQLite from 'expo-sqlite';
import { Stamp, Category, CalendarEntry } from '../types';

const db = SQLite.openDatabaseSync('stampapp.db');

// ─── Schema ───────────────────────────────────────────────────────────────────
export function initDb() {
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
  // Detach stamps from this category before deleting it
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
    'INSERT INTO stamps (imageUri, name, note, date, categoryId) VALUES (?, ?, ?, ?, ?)',
    [stamp.imageUri, stamp.name, stamp.note, stamp.date, stamp.categoryId ?? null],
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
  // Remove calendar entries that reference this stamp, then delete the stamp itself
  db.runSync('DELETE FROM calendar WHERE stampId = ?', [id]);
  db.runSync('DELETE FROM stamps WHERE id = ?', [id]);
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
