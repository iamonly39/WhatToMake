import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

async function main() {
  const schemaPath = path.join(process.cwd(), 'scripts', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Split on semicolons and run each statement
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    console.log(`Running: ${statement.slice(0, 60)}...`);
    await sql.query(statement);
  }

  console.log('Database schema applied successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to set up database:', err);
  process.exit(1);
});
