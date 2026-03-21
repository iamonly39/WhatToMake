export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { scoreMeals } from '@/lib/suggestions';
import type { Meal, HistoryEntry } from '@/lib/db';

export async function GET() {
  const { rows: meals } = await sql`SELECT * FROM meals`;
  const { rows: history } = await sql`SELECT * FROM meal_history`;
  const scored = scoreMeals(meals as Meal[], history as HistoryEntry[]);
  return NextResponse.json({ suggestions: scored.slice(0, 3) });
}
