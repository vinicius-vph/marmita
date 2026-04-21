// Applies pending migrations in supabase/migrations/ via the Supabase Management API (HTTPS).
// Tracks applied versions in supabase_migrations.schema_migrations — same table used by the
// Supabase CLI — so local (CLI) and remote (this script) state stay in sync.
//
// Bootstrap detection: if the tracking table is empty but the DB schema already exists,
// all current migration files are marked as applied without re-running their SQL.
// This handles the transition from an untracked DB to a tracked one.
//
// No direct TCP connection to the database — works on any network, including IPv6-restricted environments.
//
// Required env vars:
//   SUPABASE_ACCESS_TOKEN — supabase.com → Account Settings → Access Tokens
//   SUPABASE_PROJECT_REF  — project reference ID (the subdomain in your Supabase URL)

const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');

const API = 'https://api.supabase.com/v1';

async function query(ref, token, sql) {
  const res = await fetch(`${API}/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body);
  }

  return res.json();
}

function versionFromFile(filename) {
  // '20260421173500_login_attempts.sql' → '20260421173500'
  return filename.split('_')[0];
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.SUPABASE_PROJECT_REF;

  if (!token || !ref) {
    throw new Error('Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF');
  }

  // Ensure the tracking table exists (idempotent, safe to run every time)
  await query(ref, token, `
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text NOT NULL PRIMARY KEY
    );
  `);

  // Fetch already-applied versions
  const rows = await query(ref, token,
    'SELECT version FROM supabase_migrations.schema_migrations ORDER BY version'
  );
  const applied = new Set(rows.map(r => r.version));

  const dir = join(__dirname, '../supabase/migrations');
  const allFiles = readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  // Bootstrap detection: tracking table is empty but the DB schema is already set up.
  // Mark every known migration as applied without re-running the SQL so future runs
  // only execute genuinely new migrations.
  if (applied.size === 0) {
    const [{ exists }] = await query(ref, token,
      "SELECT (to_regclass('public.menu_items') IS NOT NULL) AS exists"
    );

    if (exists) {
      console.log('Bootstrapping migration tracking (schema already exists)...');
      for (const file of allFiles) {
        const version = versionFromFile(file);
        await query(ref, token,
          `INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('${version}') ON CONFLICT DO NOTHING`
        );
        console.log(`  Marked ${file} as applied.`);
      }
      console.log('\nBootstrap complete. Future runs will only apply new migrations.');
      return;
    }
  }

  // Normal flow: apply only pending migrations
  const pending = allFiles.filter(f => !applied.has(versionFromFile(f)));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const file of pending) {
    const version = versionFromFile(file);
    const sql = readFileSync(join(dir, file), 'utf8');
    process.stdout.write(`Applying ${file}... `);

    // Run migration + record version atomically
    await query(ref, token, `
      BEGIN;
      ${sql}
      INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('${version}');
      COMMIT;
    `);

    console.log('done');
  }

  console.log('\nAll pending migrations applied successfully.');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
