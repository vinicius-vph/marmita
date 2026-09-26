#!/usr/bin/env node
/**
 * use-local-db.js
 *
 * Lê as chaves locais do Supabase (`supabase status`) e atualiza .env.local
 * automaticamente. Chamado por `npm run db:start` após `supabase start`.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env.local');

function parseSupabaseStatus(output) {
  const get = (label) => {
    const match = output.match(new RegExp(`${label}\\s*│\\s*([^│]+)`));
    return match ? match[1].trim() : null;
  };

  return {
    url: get('Project URL'),
    anonKey: get('Publishable'),
    serviceRoleKey: get('Secret'),
  };
}

function updateEnvFile(envPath, values) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  const set = (key, value) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const line = `${key}=${value}`;
    if (regex.test(content)) {
      content = content.replace(regex, line);
    } else {
      content += `\n${line}`;
    }
  };

  set('NEXT_PUBLIC_SUPABASE_URL', values.url);
  set('NEXT_PUBLIC_SUPABASE_ANON_KEY', values.anonKey);
  set('SUPABASE_SERVICE_ROLE_KEY', values.serviceRoleKey);

  fs.writeFileSync(envPath, content.trimStart());
}

function readEnvValue(envPath, key) {
  if (!fs.existsSync(envPath)) return null;
  const match = fs.readFileSync(envPath, 'utf8').match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

try {
  const status = execSync('npx supabase status', { encoding: 'utf8' });
  const values = parseSupabaseStatus(status);

  // Sem o serviço `auth` o status não imprime as chaves; como são estáveis em local,
  // reaproveitam-se as que já estão no .env.local.
  values.anonKey ??= readEnvValue(ENV_FILE, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  values.serviceRoleKey ??= readEnvValue(ENV_FILE, 'SUPABASE_SERVICE_ROLE_KEY');

  if (!values.url || !values.anonKey || !values.serviceRoleKey) {
    console.error('Erro: não foi possível obter as chaves locais do Supabase.');
    console.error('Numa máquina nova, arranca uma vez com todos os serviços: npm run dev:cli -- restart --full');
    process.exit(1);
  }

  updateEnvFile(ENV_FILE, values);

  console.log('\n✓ .env.local atualizado com as chaves locais do Supabase:');
  console.log(`  NEXT_PUBLIC_SUPABASE_URL=${values.url}`);
  console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY=${values.anonKey.slice(0, 20)}...`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY=${values.serviceRoleKey.slice(0, 20)}...`);
  console.log('\n→ Reinicia o servidor: npm run dev\n');
} catch (err) {
  console.error('Erro ao ler supabase status:', err.message);
  process.exit(1);
}
