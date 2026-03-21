'use client';

import { useState } from 'react';

export default function PreferencesClient({ initialNotes }: { initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dietary_notes: notes }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Current dietary notes</p>
        <p className="text-xs text-amber-600">
          Write anything here — the AI will read this when suggesting meals. Examples: "Low salt.
          No shellfish. Not spicy. Not crunchy — son has sensory issues with food texture."
        </p>
      </div>

      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        rows={8}
        placeholder="Low salt. No shellfish. Not spicy. Not crunchy."
        className="border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none w-full"
      />

      <button
        onClick={save}
        disabled={saving}
        className={`w-full py-4 font-bold rounded-2xl active:scale-95 transition-all disabled:opacity-40 text-base
          ${saved ? 'bg-green-500 text-white' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Preferences'}
      </button>
    </div>
  );
}
