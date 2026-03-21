export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/anthropic';

const CATEGORIES = ['casserole', 'pasta', 'soup', 'stir-fry', 'salad', 'sandwich', 'other'];

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  let pageContent = '';
  let fetchFailed = false;

  // Best-effort fetch of the page
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WhatToMake meal planner)',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const html = await res.text();
      // Strip tags, keep reasonable amount of text for Claude
      pageContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 8000);
    } else {
      fetchFailed = true;
    }
  } catch {
    fetchFailed = true;
  }

  const prompt = fetchFailed
    ? `Based only on this recipe URL, make your best guess at the recipe name, category, and a brief description:

URL: ${url}

Categories available: ${CATEGORIES.join(', ')}

Return ONLY JSON: {"name":"...","category":"...","notes":"..."}`
    : `Extract recipe information from this webpage content.

URL: ${url}
Content: ${pageContent}

Categories available: ${CATEGORIES.join(', ')}

Return ONLY JSON with these fields:
- name: the recipe name (short and clear)
- category: one of ${CATEGORIES.join(', ')}
- notes: a brief 1-2 sentence description of the dish and main ingredients

Example: {"name":"Chicken Tikka Masala","category":"other","notes":"Creamy tomato-based curry with tender chicken. Main ingredients: chicken, tomatoes, cream, garam masala."}`;

  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 });
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not parse recipe details' }, { status: 500 });
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ ...parsed, source_url: url, fetch_failed: fetchFailed });
}
