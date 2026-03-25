'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { SpoonacularRecipe } from '@/lib/spoonacular';

type Props = { recipe: SpoonacularRecipe };

export default function DiscoverCard({ recipe }: Props) {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function addToLibrary() {
    setLoading(true);
    try {
      // Parse the recipe via Claude to get category/notes
      const res = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: recipe.sourceUrl ?? `https://spoonacular.com/recipes/${recipe.id}` }),
      });
      const parsed = await res.json();
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsed.name ?? recipe.title,
          category: parsed.category ?? 'other',
          notes: parsed.notes ?? null,
          source_url: recipe.sourceUrl ?? null,
        }),
      });
      setAdded(true);
    } catch {
      // allow retry
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {recipe.image && (
        <div className="relative h-36 w-full bg-gray-100">
          <Image src={recipe.image} alt={recipe.title} fill className="object-cover" />
        </div>
      )}
      <div className="p-3 flex flex-col gap-2">
        <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">
          {recipe.title}
        </p>
        {recipe.readyInMinutes && (
          <p className="text-xs text-gray-400">⏱ {recipe.readyInMinutes} min</p>
        )}
        <button
          onClick={addToLibrary}
          disabled={added || loading}
          className={`mt-1 w-full py-2 rounded-xl text-sm font-semibold transition-colors active:scale-95
            ${added
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-brand-500 text-white hover:bg-brand-600'}`}
        >
          {loading ? 'Adding…' : added ? '✓ Added' : 'Add to Library'}
        </button>
      </div>
    </div>
  );
}
