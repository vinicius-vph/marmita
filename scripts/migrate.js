// Applies all migrations in supabase/migrations/ via the Supabase Management API (HTTPS).
// No direct TCP connection to the database — works on any network, including IPv6-restricted environments.
//
// Required env vars:
//   SUPABASE_ACCESS_TOKEN — supabase.com → Account Settings → Access Tokens
//   SUPABASE_PROJECT_REF  — project reference ID (the subdomain in your Supabase URL)

const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.SUPABASE_PROJECT_REF;

  if (!token || !ref) {
    throw new Error('Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF');
  }

  const dir = join(__dirname, '../supabase/migrations');
  const files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf8');
    process.stdout.write(`Applying ${file}... `);

    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`\nFailed to apply ${file}:\n${body}`);
    }

    console.log('done');
  }

  console.log('\nAll migrations applied successfully.');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
