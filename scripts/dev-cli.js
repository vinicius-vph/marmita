#!/usr/bin/env node
/**
 * dev-cli.js — orquestra o ambiente local (Docker/Supabase + Next.js dev).
 *
 * Uso: npm run dev:cli -- <comando>
 *   up        Arranca o Supabase local só com os serviços necessários (db, rest, kong, storage)
 *             e o Next.js (porta 28417, ou a seguinte livre). Opções:
 *               --studio  inclui o Supabase Studio (:54323)
 *               --full    arranca todos os serviços do Supabase
 *   down      Pára o Next.js e o Supabase
 *   status    Mostra o estado do Docker, Supabase e Next.js
 *   restart   down + up
 *   logs      Segue os logs do Next.js
 *   e2e [...] Corre o Playwright contra o servidor local (args passam para o playwright)
 *   reset     Recria a BD local a partir das migrations + seed e cifra os dados de exemplo (exige --yes)
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// Fora do projeto: o Turbopack vigia a pasta do projeto e recarregaria a cada linha de log.
const STATE_DIR = path.join(os.tmpdir(), 'marmita-dev');
const STATE_FILE = path.join(STATE_DIR, 'state.json');
const LOG_FILE = path.join(STATE_DIR, 'next.log');
const NEXT_BIN = path.join(ROOT, 'node_modules', '.bin', 'next');
const PREFERRED_PORT = 28417;
const PORT_SEARCH_LIMIT = 20;
const READY_TIMEOUT_MS = 90_000;

// Serviços que a app nunca usa (auth é JWT próprio; sem realtime, edge functions ou emails).
const UNUSED_SERVICES = ['gotrue', 'realtime', 'edge-runtime', 'mailpit', 'logflare', 'vector', 'imgproxy', 'supavisor'];
const STUDIO_SERVICES = ['studio', 'postgres-meta'];

const log = (msg) => console.log(msg);
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

function run(cmd, args, { quiet = true } = {}) {
  return spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: quiet ? 'pipe' : 'inherit' });
}

const supabase = (args, opts) => run('npx', ['--no-install', 'supabase', ...args], opts);

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '0.0.0.0');
  });
}

async function findFreePort() {
  for (let port = PREFERRED_PORT; port < PREFERRED_PORT + PORT_SEARCH_LIMIT; port++) {
    if (await isPortFree(port)) return port;
  }
  fail(`Sem porta livre entre ${PREFERRED_PORT} e ${PREFERRED_PORT + PORT_SEARCH_LIMIT - 1}.`);
}

async function isUp(url) {
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(3000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

function dockerRunning() {
  return run('docker', ['info']).status === 0;
}

function supabaseRunning() {
  return supabase(['status']).status === 0;
}

function nextState() {
  const state = readState();
  return state && isAlive(state.pid) ? state : null;
}

function excludedServices() {
  const flags = process.argv.slice(3);
  if (flags.includes('--full')) return [];
  return flags.includes('--studio') ? UNUSED_SERVICES : [...UNUSED_SERVICES, ...STUDIO_SERVICES];
}

function ensureSupabase() {
  if (!dockerRunning()) fail('Docker não está a correr. Inicia o Docker e tenta de novo.');

  if (supabaseRunning()) {
    log('✓ Supabase local já está a correr (para mudar de modo: restart [--studio|--full])');
  } else {
    // O CLI pode achar que está "already running" com containers parados: limpar antes de arrancar.
    log('… a arrancar Supabase local (pode demorar)');
    supabase(['stop']);
    const excluded = excludedServices();
    const started = supabase(['start', ...(excluded.length ? ['-x', excluded.join(',')] : [])], { quiet: false });
    if (started.status !== 0) fail('supabase start falhou.');
  }

  const sync = run('node', [path.join(__dirname, 'use-local-db.js')]);
  if (sync.status !== 0) fail(`Não foi possível atualizar o .env.local:\n${sync.stderr}`);
  log('✓ .env.local sincronizado com as chaves locais');
}

async function startNext() {
  const running = nextState();
  if (running) {
    log(`✓ Next.js já está a correr em http://localhost:${running.port}`);
    return running.port;
  }

  const port = await findFreePort();
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const out = fs.openSync(LOG_FILE, 'w');
  const child = spawn(NEXT_BIN, ['dev', '-p', String(port)], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env, RATE_LIMIT_DISABLED: 'true' },
  });
  child.unref();
  writeState({ pid: child.pid, port });

  const url = `http://localhost:${port}`;
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (!isAlive(child.pid)) fail(`Next.js terminou inesperadamente. Ver ${LOG_FILE}`);
    if (await isUp(url)) {
      log(`✓ Next.js em ${url}${port !== PREFERRED_PORT ? ` (porta ${PREFERRED_PORT} ocupada)` : ''}`);
      return port;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  fail(`Next.js não respondeu a tempo. Ver ${LOG_FILE}`);
}

function stopNext() {
  const state = nextState();
  if (!state) return log('· Next.js não estava a correr');
  try {
    process.kill(-state.pid, 'SIGTERM');
  } catch {
    process.kill(state.pid, 'SIGTERM');
  }
  fs.rmSync(STATE_FILE, { force: true });
  log('✓ Next.js parado');
}

function stopSupabase() {
  const result = supabase(['stop']);
  log(result.status === 0 ? '✓ Supabase parado (dados preservados)' : '✗ supabase stop falhou');
}

async function up() {
  ensureSupabase();
  const port = await startNext();
  log(`\nAdmin: http://localhost:${port}/admin/login`);
  log('Estado: npm run dev:cli -- status  |  Parar: npm run dev:cli -- down');
}

function down() {
  stopNext();
  stopSupabase();
}

async function status() {
  const docker = dockerRunning();
  log(`Docker:    ${docker ? '✓ a correr' : '✗ parado'}`);
  log(`Supabase:  ${docker && supabaseRunning() ? '✓ a correr (http://127.0.0.1:54321)' : '✗ parado'}`);
  const state = nextState();
  if (!state) return log('Next.js:   ✗ parado');
  const healthy = await isUp(`http://localhost:${state.port}`);
  log(`Next.js:   ${healthy ? '✓' : '… a arrancar'} http://localhost:${state.port} (pid ${state.pid})`);
}

function logs() {
  if (!fs.existsSync(LOG_FILE)) fail('Ainda não há logs. Corre "up" primeiro.');
  spawn('tail', ['-n', '50', '-f', LOG_FILE], { stdio: 'inherit' });
}

function e2e(args) {
  const state = nextState();
  if (!state) fail('Next.js não está a correr. Corre "up" primeiro.');
  if (!process.env.ADMIN_PASSWORD) {
    log('! ADMIN_PASSWORD não definido — testes de admin serão ignorados ou falharão.');
  }
  const result = spawnSync(path.join(ROOT, 'node_modules', '.bin', 'playwright'), ['test', ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, BASE_URL: `http://localhost:${state.port}` },
  });
  process.exit(result.status ?? 1);
}

function reset(args) {
  if (!args.includes('--yes')) fail('reset apaga os dados locais. Repete com --yes para confirmar.');
  if (!supabaseRunning()) fail('Supabase local não está a correr. Corre "up" primeiro.');
  const result = supabase(['db', 'reset'], { quiet: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
  // O seed insere dados de exemplo em claro; cifrar já a seguir, como em produção.
  const encrypted = run('npm', ['run', 'pii:encrypt', '--', '--apply'], { quiet: false });
  process.exit(encrypted.status ?? 1);
}

const commands = {
  up,
  down,
  status,
  logs,
  reset: () => reset(process.argv.slice(3)),
  e2e: () => e2e(process.argv.slice(3)),
  restart: async () => {
    down();
    await up();
  },
};

const command = commands[process.argv[2]];
if (!command) {
  console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace('#!/usr/bin/env node\n/**', '').replace(/^ \* ?/gm, ''));
  process.exit(process.argv[2] ? 1 : 0);
}
Promise.resolve(command()).catch((e) => fail(e.message));
