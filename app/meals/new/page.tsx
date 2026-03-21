'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['casserole', 'pasta', 'soup', 'stir-fry', 'salad', 'sandwich', 'other'];

export default function NewMealPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [parsing, setParsing] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [saving, setSaving] = useState(false);

  async function parseUrl() {
    if (!url.trim()) return;
    setParsing(true);
    setFetchFailed(false);
    const res = await fetch('/api/parse-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    });
    const data = await res.json();
    if (data.name) setName(data.name);
    if (data.category) setCategory(data.category);
    if (data.notes) setNotes(data.notes);
    setSourceUrl(url.trim());
    setFetchFailed(!!data.fetch_failed);
    setParsing(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, notes, source_url: sourceUrl || null }),
    });
    const data = await res.json();
    router.push(`/meals/${data.meal.id}`);
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-gray-900">Add Meal</h1>

      {/* URL parser */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700">Have a recipe link? Paste it here.</p>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            type="button"
            onClick={parseUrl}
            disabled={parsing || !url.trim()}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform"
          >
            {parsing ? '…' : 'Parse'}
          </button>
        </div>
        {fetchFailed && (
          <p className="text-xs text-amber-600">
            Couldn't fetch that page — fields pre-filled from the URL. Please review them.
          </p>
        )}
      </div>

      {/* Manual form */}
      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chicken Spaghetti"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ingredients, tips, or anything to remember…"
            rows={3}
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Recipe URL</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full py-4 bg-brand-500 text-white font-bold rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-40 text-base"
        >
          {saving ? 'Saving…' : 'Save Meal'}
        </button>
      </form>
    </div>
  );
}
