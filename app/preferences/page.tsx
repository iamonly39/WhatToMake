export const dynamic = 'force-dynamic';

import { sql } from '@/lib/db';
import PreferencesClient from './PreferencesClient';

export default async function PreferencesPage() {
  const { rows } = await sql`SELECT value FROM settings WHERE key = 'dietary_notes'`;
  const dietaryNotes = rows[0]?.value ?? '';
  return (
    <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Preferences</h1>
        <p className="text-sm text-gray-500 mt-1">
          Dietary notes are used to guide AI suggestions and filter Discover results.
        </p>
      </div>
      <PreferencesClient initialNotes={dietaryNotes} />
    </div>
  );
}
