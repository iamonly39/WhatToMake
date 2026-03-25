'use client';

import { useState } from 'react';
import type { AiSuggestion } from '@/app/api/ai-suggestions/route';

type Props = { suggestion: AiSuggestion };

export default function AiSuggestionCard({ suggestion }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'added'>('idle');

  async function addToLibrary() {
    setState('loading');
    try {
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggestion.name,
          category: suggestion.category,
          notes: suggestion.description,
        }),
      });
      setState('added');
    } catch {
      setState('idle');
    }
  }

  return (
    <div className="bg-gradient-to-br from-brand-50 to-orange-50 rounded-2xl border border-brand-100 p-4 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <span className="text-lg">✨</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">{suggestion.name}</p>
          <span className="text-xs text-brand-600 font-medium">{suggestion.category}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600">{suggestion.description}</p>
      <p className="text-xs text-gray-400 italic">{suggestion.why}</p>
      <button
        onClick={addToLibrary}
        disabled={state !== 'idle'}
        className={`mt-1 w-full py-2 rounded-xl text-sm font-semibold transition-colors active:scale-95
          ${state === 'added'
            ? 'bg-green-100 text-green-700 cursor-default'
            : 'bg-brand-500 text-white hover:bg-brand-600'}`}
      >
        {state === 'loading' ? 'Adding…' : state === 'added' ? '✓ Added to Library' : '+ Add to Library'}
      </button>
    </div>
  );
}
