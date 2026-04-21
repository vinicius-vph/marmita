function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const authSecret = requireEnv('AUTH_SECRET');
if (authSecret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');

const adminPasswordHashB64 = requireEnv('ADMIN_PASSWORD_HASH');
const adminPasswordHash = Buffer.from(adminPasswordHashB64, 'base64').toString('utf8');
if (!adminPasswordHash.startsWith('$2')) {
  throw new Error('ADMIN_PASSWORD_HASH must be a valid bcrypt hash encoded in base64');
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  AUTH_SECRET: authSecret,
  ADMIN_PASSWORD_HASH: adminPasswordHash,
  MBWAY_PHONE: process.env.MBWAY_PHONE ?? '',
  WHATSAPP_PHONE: process.env.WHATSAPP_PHONE ?? '',
  INSTAGRAM_URL: process.env.INSTAGRAM_URL ?? 'https://www.instagram.com',
  FACEBOOK_URL: process.env.FACEBOOK_URL ?? 'https://www.facebook.com',
};
