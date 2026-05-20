// ─── Domain types ─────────────────────────────────────────────────────────────

export type StampFilter = 'original' | 'bw' | 'fade';
export type StampShape  = 'square' | 'landscape' | 'portrait' | 'diamond' | 'triangle';

export interface Category {
  id:   number;
  name: string;
}

export interface Stamp {
  id:         number;
  imageUri:   string;
  name:       string;
  note:       string;
  date:       string;        // ISO date string YYYY-MM-DD
  categoryId: number | null;
  filter:     StampFilter;   // visual filter applied at creation
  shape:      StampShape;    // outline shape used at creation
}

export interface CalendarEntry {
  date:    string; // YYYY-MM-DD
  stampId: number;
}
