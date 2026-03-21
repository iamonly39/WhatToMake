import { sql } from '@vercel/postgres';

// Re-export the tagged template sql helper for use in API routes.
// @vercel/postgres manages the connection pool automatically.
export { sql };

// Typed helpers for common queries

export type Meal = {
  id: number;
  name: string;
  category: string;
  notes: string | null;
  source_url: string | null;
  created_at: string;
  avg_rating?: number | null;
};

export type HistoryEntry = {
  id: number;
  meal_id: number;
  meal_name?: string;
  made_on: string;
  rating: number | null;
  notes: string | null;
};

export type WeeklyPlan = {
  id: number;
  week_of: string;
  meal_ids: number[];
  meals?: Meal[];
};
