// Re-encrypts customer_name_enc/customer_phone_enc still under an older PII_ENCRYPTION_KEY_V<n>
// with the currently active key version (PII_ENCRYPTION_KEY_ACTIVE_VERSION). Run after adding the
// new key and bumping the active version — both old and new PII_ENCRYPTION_KEY_V<n> vars must be
// present so old rows can still be decrypted. Idempotent: rows already on the active version are
// skipped. Dry-run unless --apply is passed.
//
// Usage (Node >= 22.6):
//   node --experimental-strip-types --no-warnings --env-file=.env.local scripts/rotate-pii-key.ts [--apply]
// Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PII_ENCRYPTION_KEY_V<n> (old and new)
// Non-local databases also require --allow-remote.

import { createClient } from '@supabase/supabase-js';
import { decryptPii, encryptPii } from '../src/lib/pii.ts';

const BATCH_SIZE = 200;
const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];

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

const activeVersion = `v${(process.env.PII_ENCRYPTION_KEY_ACTIVE_VERSION ?? '1').trim()}`;
const supabase = createClient(url, serviceKey);

function isStale(value: string | null): value is string {
  return !!value && !value.startsWith(`${activeVersion}:`);
}

async function main() {
  console.log(`Target: ${host} (${apply ? 'APPLY' : 'dry-run'}) — rotating to ${activeVersion}`);

  let offset = 0;
  let scanned = 0;
  let rotated = 0;

  for (;;) {
    const { data, error } = await supabase
      .from('reservations')
      .select('id, customer_name_enc, customer_phone_enc')
      .order('id')
      .range(offset, offset + BATCH_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      const staleName = isStale(row.customer_name_enc);
      const stalePhone = isStale(row.customer_phone_enc);
      if (!staleName && !stalePhone) continue;

      rotated++;
      if (!apply) continue;

      const update: Record<string, string> = {};
      if (staleName) {
        update.customer_name_enc = encryptPii(decryptPii(row.customer_name_enc, 'customer_name'), 'customer_name');
      }
      if (stalePhone) {
        update.customer_phone_enc = encryptPii(decryptPii(row.customer_phone_enc, 'customer_phone'), 'customer_phone');
      }
      const { error: updateError } = await supabase.from('reservations').update(update).eq('id', row.id);
      if (updateError) throw updateError;
    }

    scanned += data.length;
    offset += BATCH_SIZE;
    console.log(`Scanned ${scanned}, ${apply ? 'rotated' : 'pending'} ${rotated}`);
  }

  console.log(`Done. Scanned ${scanned} rows, ${apply ? 'rotated' : 'would rotate'} ${rotated}.`);
  if (!apply && rotated > 0) {
    console.log('Re-run with --apply once the new key is verified.');
  }
}

main().catch((e) => {
  console.error('Rotation failed:', e.message ?? e);
  process.exit(1);
});
