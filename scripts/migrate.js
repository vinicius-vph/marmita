// Applies only pending migrations in supabase/migrations/ via the Supabase Management API (HTTPS).
// Tracks applied migrations via supabase_migrations.schema_migrations (same table used by Supabase CLI).
// No direct TCP connection to the database — works on any network, including IPv6-restricted environments.
//
// Required env vars:
//   SUPABASE_ACCESS_TOKEN — supabase.com → Account Settings → Access Tokens
//   SUPABASE_PROJECT_REF  — project reference ID (the subdomain in your Supabase URL)

const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');

async function query(ref, token, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.text();
  if (!res.ok) throw new Error(body);
  return JSON.parse(body);
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.SUPABASE_PROJECT_REF;

  if (!token || !ref) {
    throw new Error('Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF');
  }

  // Ensure the tracking table exists (idempotent)
  await query(ref, token, `
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY,
      statements text[],
      name text
    );
  `);

  const applied = await query(ref, token, `SELECT version FROM supabase_migrations.schema_migrations`);
  const appliedVersions = new Set(applied.map(r => r.version));

  const dir = join(__dirname, '../supabase/migrations');
  const files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  let pendingCount = 0;

  for (const file of files) {
    // Version is the timestamp prefix (everything before the first underscore after the timestamp)
    const version = file.replace(/\.sql$/, '');

    if (appliedVersions.has(version)) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }

    const sql = readFileSync(join(dir, file), 'utf8');
    process.stdout.write(`Applying ${file}... `);

    await query(ref, token, sql);

    await query(ref, token, `
      INSERT INTO supabase_migrations.schema_migrations (version, name)
      VALUES ('${version}', '${file}')
      ON CONFLICT (version) DO NOTHING;
    `);

    console.log('done');
    pendingCount++;
  }

  if (pendingCount === 0) {
    console.log('No pending migrations.');
  } else {
    console.log(`\n${pendingCount} migration(s) applied successfully.`);
  }
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
