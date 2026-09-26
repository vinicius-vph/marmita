import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;

export type PiiContext = 'customer_name' | 'customer_phone';

export function parsePiiKey(base64: string | undefined): Buffer {
  if (!base64) throw new Error('Missing required environment variable: PII_ENCRYPTION_KEY');
  const key = Buffer.from(base64, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error('PII_ENCRYPTION_KEY must be 32 bytes encoded in base64');
  }
  return key;
}

const currentKey = () => parsePiiKey(process.env.PII_ENCRYPTION_KEY);

// `context` is authenticated but not stored, so a ciphertext cannot be moved between columns.
export function encryptPii(plaintext: string, context: PiiContext): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, currentKey(), iv);
  cipher.setAAD(Buffer.from(context));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const b64 = (buffer: Buffer) => buffer.toString('base64');
  return [VERSION, b64(iv), b64(cipher.getAuthTag()), b64(ciphertext)].join(':');
}

export function decryptPii(payload: string, context: PiiContext): string {
  const [version, iv, tag, ciphertext] = payload.split(':');
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error('Unsupported encrypted payload format');
  }
  const decipher = createDecipheriv(ALGORITHM, currentKey(), Buffer.from(iv, 'base64'));
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
