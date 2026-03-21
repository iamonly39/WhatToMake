export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { searchRecipes } from '@/lib/spoonacular';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') ?? '';
  const { rows: settings } = await sql`SELECT value FROM settings WHERE key = 'dietary_notes'`;
  const dietaryNotes = settings[0]?.value ?? '';

  if (!process.env.SPOONACULAR_API_KEY) {
    return NextResponse.json(
      { error: 'SPOONACULAR_API_KEY not configured' },
      { status: 503 }
    );
  }

  const recipes = await searchRecipes(query || 'dinner casserole', dietaryNotes);
  return NextResponse.json({ recipes });
}
