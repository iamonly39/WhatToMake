export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAnthropicClient } from '@/lib/anthropic';

export type AiSuggestion = {
  name: string;
  category: string;
  description: string;
  why: string;
};

export async function GET() {
  const { rows: meals } = await sql`SELECT name FROM meals ORDER BY name`;
  const { rows: recentHistory } = await sql`
    SELECT m.name, h.made_on
    FROM meal_history h
    JOIN meals m ON m.id = h.meal_id
    ORDER BY h.made_on DESC
    LIMIT 10
  `;
  const { rows: settings } = await sql`SELECT value FROM settings WHERE key = 'dietary_notes'`;
  const dietaryNotes = settings[0]?.value ?? '';

  const mealNames = meals.map((m) => m.name).join(', ');
  const recentMeals = recentHistory
    .map((h) => `${h.name} (${h.made_on})`)
    .join(', ');

  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a helpful meal planning assistant for a family.

Household dietary requirements: ${dietaryNotes || 'None specified'}

Meals we've made recently: ${recentMeals || 'None yet'}
Meals already in our library (do not suggest these): ${mealNames || 'None yet'}

Suggest 3 new meal ideas that:
1. Fit our dietary requirements
2. Are different from what we've made recently
3. Are not already in our library
4. Work well as batch-cooked Sunday meals that last the week (casseroles, soups, pasta dishes, etc.)
5. Are family-friendly and not too exotic

Return ONLY a JSON array with exactly 3 objects, each with these fields:
- name: short recipe name
- category: one of casserole, pasta, soup, stir-fry, salad, sandwich, other
- description: one sentence describing the dish
- why: one sentence on why it fits our preferences and history

Example format:
[{"name":"...","category":"...","description":"...","why":"..."}]`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 });
  }

  // Extract JSON from the response
  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
  }

  const suggestions: AiSuggestion[] = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ suggestions });
}
