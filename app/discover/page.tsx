'use client';

import { useState } from 'react';
import DiscoverCard from '@/components/DiscoverCard';
import type { SpoonacularRecipe } from '@/lib/spoonacular';

const QUICK_SEARCHES = ['casserole', 'soup', 'pasta', 'chicken dinner', 'stir fry', 'slow cooker'];

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState<SpoonacularRecipe[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search(q?: string) {
    const term = q ?? query;
    setLoading(true);
    setError('');
    const res = await fetch(`/api/discover?query=${encodeURIComponent(term)}`);
    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      setRecipes(data.recipes);
    }
    setLoading(false);
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-gray-900">Discover Recipes</h1>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Search recipes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          onClick={() => search()}
          disabled={loading}
          className="px-5 py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
        >
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {/* Quick search chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_SEARCHES.map((term) => (
          <button
            key={term}
            onClick={() => { setQuery(term); search(term); }}
            className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 active:bg-gray-100 transition-colors"
          >
            {term}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">
          {error === 'SPOONACULAR_API_KEY not configured'
            ? 'Spoonacular API key not set. Add SPOONACULAR_API_KEY to your environment variables.'
            : error}
        </div>
      )}

      {/* Results */}
      {recipes === null && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>Search above or tap a quick filter to browse recipes.</p>
          <p className="text-sm mt-1">Results are filtered by your dietary preferences.</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
          ))}
        </div>
      )}

      {recipes && !loading && (
        recipes.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No results found. Try a different search.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recipes.map((recipe) => (
              <DiscoverCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
