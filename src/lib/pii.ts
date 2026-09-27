import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const KEY_VAR_PATTERN = /^PII_ENCRYPTION_KEY_(V\d+)$/;

export type PiiContext = 'customer_name' | 'customer_phone';

function parseKey(base64: string, envVar: string): Buffer {
  const key = Buffer.from(base64, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(`${envVar} must be 32 bytes encoded in base64`);
  }
  return key;
}

// Every `PII_ENCRYPTION_KEY_V<n>` env var joins the keyring, so ciphertexts written under an
// older key keep decrypting while a newer one is rolled out. `PII_ENCRYPTION_KEY_ACTIVE_VERSION`
// (plain integer, not a secret) picks which key new writes use. Rotate by adding the new var,
// bumping the active version, backfilling with scripts/rotate-pii-key.ts, then removing the old
// var — see docs/operations/pii-encryption.md.
function loadKeyring(): Map<string, Buffer> {
  const keyring = new Map<string, Buffer>();
  for (const [name, value] of Object.entries(process.env)) {
    const match = name.match(KEY_VAR_PATTERN);
    if (match && value) keyring.set(match[1].toLowerCase(), parseKey(value, name));
  }
  if (keyring.size === 0) {
    throw new Error('Missing required environment variable: PII_ENCRYPTION_KEY_V1');
  }
  return keyring;
}

function activeVersion(keyring: Map<string, Buffer>): string {
  const n = (process.env.PII_ENCRYPTION_KEY_ACTIVE_VERSION ?? '1').trim();
  const version = `v${n}`;
  if (!keyring.has(version)) {
    throw new Error(
      `PII_ENCRYPTION_KEY_ACTIVE_VERSION=${n} has no matching PII_ENCRYPTION_KEY_V${n}`
    );
  }
  return version;
}

// Throws if the keyring is misconfigured. Called at boot (src/env.ts) so a bad deploy fails fast.
export function assertPiiKeysConfigured(): void {
  activeVersion(loadKeyring());
}

// `context` is authenticated but not stored, so a ciphertext cannot be moved between columns.
export function encryptPii(plaintext: string, context: PiiContext): string {
  const keyring = loadKeyring();
  const version = activeVersion(keyring);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, keyring.get(version)!, iv);
  cipher.setAAD(Buffer.from(context));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const b64 = (buffer: Buffer) => buffer.toString('base64');
  return [version, b64(iv), b64(cipher.getAuthTag()), b64(ciphertext)].join(':');
}

export function decryptPii(payload: string, context: PiiContext): string {
  const [version, iv, tag, ciphertext] = payload.split(':');
  if (!version || !iv || !tag || !ciphertext) {
    throw new Error('Unsupported encrypted payload format');
  }
  const key = loadKeyring().get(version);
  if (!key) throw new Error(`No PII encryption key configured for version "${version}"`);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'));
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
