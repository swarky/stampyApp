export interface Category {
  id: number;
  name: string;
}

export interface Stamp {
  id: number;
  imageUri: string;
  name: string;
  note: string;
  date: string; // ISO date string YYYY-MM-DD
  categoryId: number | null;
}

export interface CalendarEntry {
  date: string; // YYYY-MM-DD
  stampId: number;
}
