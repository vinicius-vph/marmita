// Keeps the Supabase free-tier instance awake by making a lightweight
// query every few days. Free instances pause after 7 days of inactivity.
//
// Usage (requires Node.js ≥ 20):
//   node --env-file=.env.local scripts/keep-alive.js
//
// Suggested crontab (runs every 5 days at 08:00):
//   0 8 */5 * * cd /path/to/marmita && node --env-file=.env.local scripts/keep-alive.js >> /var/log/marmita-keep-alive.log 2>&1

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(`[${new Date().toISOString()}] ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY`);
  process.exit(1);
}

async function main() {
  const res = await fetch(`${url}/rest/v1/menu_items?select=id&limit=1&active=eq.true`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  console.log(`[${new Date().toISOString()}] OK — Supabase responded (${data.length} row(s) in menu_items)`);
}

main().catch(err => {
  console.error(`[${new Date().toISOString()}] FAILED:`, err.message);
  process.exit(1);
});
