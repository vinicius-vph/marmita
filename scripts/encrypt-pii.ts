// Encrypts customer name/phone still stored in plaintext on `reservations`, then clears the plaintext.
// Idempotent: rows already encrypted are skipped. Dry-run unless --apply is passed.
//
// Usage (Node >= 22.6):
//   node --experimental-strip-types --no-warnings --env-file=.env.local scripts/encrypt-pii.ts [--apply]
// Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PII_ENCRYPTION_KEY_V<n>
// Non-local databases also require --allow-remote.

import { createClient } from '@supabase/supabase-js';
import { encryptPii } from '../src/lib/pii.ts';

const BATCH_SIZE = 200;
const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];
const PENDING = 'customer_name.not.is.null,customer_phone.not.is.null';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const allowRemote = args.includes('--allow-remote');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const host = new URL(url).hostname;
if (!LOCAL_HOSTS.includes(host) && !allowRemote) {
  console.error(`Target ${host} is not local. Re-run with --allow-remote if this is intended.`);
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function countPending(): Promise<number> {
  const { count, error } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .or(PENDING);
  if (error) throw error;
  return count ?? 0;
}

async function main() {
  console.log(`Target: ${host} (${apply ? 'APPLY' : 'dry-run'})`);
  const pending = await countPending();
  console.log(`Rows with plaintext: ${pending}`);
  if (!apply || pending === 0) return;

  let encrypted = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('reservations')
      .select('id, customer_name, customer_phone, customer_name_enc, customer_phone_enc')
      .or(PENDING)
      .limit(BATCH_SIZE);
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      const name =
        row.customer_name_enc ?? (row.customer_name ? encryptPii(row.customer_name, 'customer_name') : null);
      const phone =
        row.customer_phone_enc ?? (row.customer_phone ? encryptPii(row.customer_phone, 'customer_phone') : null);
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          customer_name_enc: name,
          customer_phone_enc: phone,
          customer_name: null,
          customer_phone: null,
        })
        .eq('id', row.id);
      if (updateError) throw updateError;
      encrypted++;
    }
    console.log(`Encrypted ${encrypted}/${pending}`);
  }

  const remaining = await countPending();
  console.log(`Remaining plaintext rows: ${remaining}`);
  if (remaining !== 0) process.exit(1);
}

main().catch((e) => {
  console.error('Backfill failed:', e.message ?? e);
  process.exit(1);
});
