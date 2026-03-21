'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StarRating from '@/components/StarRating';
import type { Meal, HistoryEntry } from '@/lib/db';

const CATEGORIES = ['casserole', 'pasta', 'soup', 'stir-fry', 'salad', 'sandwich', 'other'];

type Props = {
  meal: Meal & { avg_rating: number | null };
  history: HistoryEntry[];
};

export default function MealDetailClient({ meal, history: initialHistory }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(meal.name);
  const [category, setCategory] = useState(meal.category);
  const [notes, setNotes] = useState(meal.notes ?? '');
  const [sourceUrl, setSourceUrl] = useState(meal.source_url ?? '');
  const [saving, setSaving] = useState(false);
  const [markingMade, setMarkingMade] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function saveEdits() {
    setSaving(true);
    await fetch(`/api/meals/${meal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, notes, source_url: sourceUrl || null }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function markAsMade() {
    setMarkingMade(true);
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_id: meal.id }),
    });
    const data = await res.json();
    setHistory([data.entry, ...history]);
    setMarkingMade(false);
  }

  async function updateRating(historyId: number, rating: number) {
    await fetch(`/api/history/${historyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });
    setHistory(history.map((h) => (h.id === historyId ? { ...h, rating } : h)));
  }

  async function deleteMeal() {
    await fetch(`/api/meals/${meal.id}`, { method: 'DELETE' });
    router.push('/meals');
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-2xl font-bold w-full border-b-2 border-brand-400 focus:outline-none bg-transparent"
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">{meal.name}</h1>
          )}
          {meal.avg_rating != null && (
            <div className="mt-1">
              <StarRating value={Math.round(meal.avg_rating)} readonly />
            </div>
          )}
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm text-brand-600 font-semibold mt-1"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Category */}
      {editing ? (
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      ) : (
        <span className="inline-block text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700 self-start">
          {meal.category}
        </span>
      )}

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</label>
        {editing ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {meal.notes || <span className="text-gray-400 italic">No notes yet.</span>}
          </p>
        )}
      </div>

      {/* Recipe link */}
      {editing ? (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipe URL</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      ) : meal.source_url ? (
        <a
          href={meal.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-brand-600 text-sm font-medium"
        >
          <span>🔗</span> View Original Recipe
        </a>
      ) : null}

      {/* Save edits button */}
      {editing && (
        <button
          onClick={saveEdits}
          disabled={saving}
          className="w-full py-3 bg-brand-500 text-white font-bold rounded-2xl active:scale-95 transition-transform disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      )}

      {/* Mark as made */}
      {!editing && (
        <button
          onClick={markAsMade}
          disabled={markingMade}
          className="w-full py-3 bg-green-500 text-white font-bold rounded-2xl active:scale-95 transition-transform disabled:opacity-40"
        >
          {markingMade ? 'Recording…' : '✓ Mark as Made Today'}
        </button>
      )}

      {/* History */}
      <div className="flex flex-col gap-3">
        <h2 className="font-bold text-gray-800">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Not made yet. Hit the button above!</p>
        ) : (
          history.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {new Date(entry.made_on + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
                <StarRating
                  value={entry.rating}
                  onChange={(r) => updateRating(entry.id, r)}
                  size="sm"
                />
              </div>
              {entry.notes && <p className="text-xs text-gray-500">{entry.notes}</p>}
            </div>
          ))
        )}
      </div>

      {/* Delete */}
      {!editing && (
        <div className="pt-2 border-t border-gray-100">
          {showDeleteConfirm ? (
            <div className="flex gap-3">
              <button
                onClick={deleteMeal}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl active:scale-95 transition-transform"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-2xl"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 text-red-500 font-semibold text-sm"
            >
              Delete Meal
            </button>
          )}
        </div>
      )}
    </div>
  );
}
