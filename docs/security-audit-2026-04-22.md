# Relatório de Auditoria de Segurança

**Projeto:** Marmita Solidária  
**Data:** 2026-04-22  
**Âmbito:** Revisão completa do código-fonte (API Routes, autenticação, base de dados, CSP, E2E)  
**Auditor:** Claude Sonnet 4.6 (assistido por Vinicius Santos)

---

## Resumo Executivo

A aplicação apresenta uma postura de segurança sólida. Os vetores de ataque mais críticos estão cobertos: as senhas são comparadas com bcrypt, os tokens JWT têm revogação imediata por JTI, existe rate limiting persistente em Supabase, a proteção CSRF baseia-se em comparação Origin/Host, e todos os cálculos de preço são feitos server-side. O RLS está ativo nas tabelas sensíveis.

Foram identificados **4 problemas de prioridade média** e **4 de prioridade baixa/informativa** que não comprometem a segurança atual mas que devem ser corrigidos antes de um crescimento significativo de utilizadores ou de uma auditoria externa.

---

## Pontos Fortes

| Área | Implementação |
|------|---------------|
| Passwords | `bcrypt.compare()` — hash nunca é logaritmado nem exposto |
| JWT | HS256 com `jti` único; revogação imediata via tabela `revoked_tokens` no logout |
| Rate limit | Persistente em Supabase; 5 tentativas/15 min no login, 20/15 min nas reservas |
| CSRF | `checkOrigin()` em todas as mutações — compara `Origin` com `Host` |
| Preços | Calculados server-side a partir da BD; o cliente nunca envia o valor total |
| Upload de imagens | Validação de MIME type + magic bytes; nome UUID aleatório; tamanho máximo 2 MB |
| Security Headers | CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| RLS | Ativo em `menu_items`, `reservations`, `fundraising_config`, `revoked_tokens`, `admin_audit_log` |
| Audit log | Todas as ações de admin (criar/editar/remover prato, confirmar pagamento, atualizar meta) são registadas com IP e payload |
| Env vars | `SUPABASE_SERVICE_ROLE_KEY` nunca chega ao browser; validação de formato no arranque |
| Payload limits | `MAX_BODY` em todos os route handlers |
| UUID validation | `UUID_REGEX` valida IDs nos path params antes de qualquer query |

---

## Problemas Encontrados

### MEDIUM-01 — Cabeçalho `Strict-Transport-Security` ausente

**Ficheiro:** `next.config.ts`  
**Descrição:** Os security headers não incluem HSTS. Um atacante em rede local pode realizar SSL stripping na primeira visita HTTP, redirecionar o utilizador para uma versão não-cifrada da página e capturar o cookie `admin_session` (mesmo com `httpOnly`, o cookie é enviado em HTTP se o browser não foi informado de que o domínio só aceita HTTPS).  
**Correção:**
```typescript
{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
```
Adicionar ao array `securityHeaders` em `next.config.ts`. O valor `63072000` corresponde a 2 anos, o mínimo recomendado para preload.

---

### MEDIUM-02 — Tabela `login_attempts` sem RLS

**Ficheiro:** `supabase/migrations/20260421173500_login_attempts.sql`  
**Descrição:** A tabela `login_attempts` foi criada sem `ENABLE ROW LEVEL SECURITY` nem políticas. Qualquer cliente com a `ANON_KEY` pública pode ler o conteúdo da tabela via Supabase REST API, expondo: quais IPs (ou chaves) já esgotaram tentativas, quando ocorreram essas tentativas, e a "textura" do tráfego de login.  
**Correção:** Criar uma nova migration:
```sql
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to login_attempts"
  ON login_attempts FOR ALL
  USING (false)
  WITH CHECK (false);
```

---

### MEDIUM-03 — `unsafe-inline` em `script-src` na CSP de produção

**Ficheiro:** `next.config.ts:9`  
**Descrição:** A CSP permite `'unsafe-inline'` em scripts mesmo em produção. Isto neutraliza a proteção contra XSS refletido/stored porque um script inline injetado via XSS seria executado. O Next.js App Router suporta nonces de CSP via `headers()` com geração por request.  
**Impacto atual:** Baixo — não há ponto de injeção de HTML identificado. Mas qualquer vulnerabilidade XSS futura (dependências, geração dinâmica de HTML) seria amplificada.  
**Correção:** Migrar para CSP baseada em nonces seguindo a documentação do Next.js ([`generateBuildId`](https://nextjs.org/docs/app/api-reference/config/next-config-js/generateBuildId) + middleware nonce). Tarefa para ciclo de maturidade seguinte.

---

### MEDIUM-04 — Número de telefone não validado por formato no servidor

**Ficheiro:** `src/app/api/reservations/route.ts:64`  
**Descrição:** O servidor aceita qualquer string não-vazia até 50 caracteres como número de telefone. O frontend valida 9 dígitos, mas essa validação é bypassável com uma chamada direta à API. Dados inválidos ficam na base de dados e são exibidos ao admin sem sanitização de exibição.  
**Correção:** Adicionar validação regex server-side:
```typescript
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;
if (!PHONE_REGEX.test(customer_phone.trim())) {
  return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
}
```

---

### LOW-01 — Página `/obrigado` expõe PII via URL partilhável

**Ficheiro:** `src/app/[locale]/obrigado/page.tsx`  
**Descrição:** A URL `/obrigado?id=<uuid>` dá acesso ao nome do cliente, quantidade e valor total da reserva, sem qualquer autenticação. O UUID é suficientemente difícil de adivinhar (128 bits de entropia), mas é registado em: histórico do browser, logs de servidor, ferramentas de analytics, e pode ser partilhado inadvertidamente (ex: print de ecrã). Não é possível enumerar reservas, mas o link é funcional indefinidamente.  
**Mitigação sugerida:** Adicionar um campo `confirmation_token` de uso único à tabela `reservations` (token diferente do `id`), ou definir um TTL de visibilidade (ex: redirecionar para `/` se `created_at` tiver mais de 24h).

---

### LOW-02 — `reservation_deadline` verificado em UTC, não no fuso local

**Ficheiro:** `src/app/api/reservations/route.ts:88`  
**Descrição:** `new Date().toISOString().split('T')[0]` produz sempre a data em UTC. Portugal está em UTC+0 no inverno e UTC+1 no verão (WEST). Em período de hora de verão, um prazo de "hoje" será respeitado até às 23:00 UTC (00:00 local), mas as reservas feitas entre 23:00-00:00 local podem ser bloqueadas antes do prazo real terminar.  
**Correção:** Calcular a data no timezone do servidor ou aceitar o fuso na configuração:
```typescript
const today = new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon' })
  .format(new Date())
  .split('/')
  .reverse()
  .join('-');
```
Ou definir `TZ=Europe/Lisbon` na plataforma de deploy.

---

### LOW-03 — Tokens expirados em `revoked_tokens` nunca são limpos

**Ficheiro:** `src/lib/auth.ts`, `supabase/migrations/20260413120000_revoked_tokens.sql`  
**Descrição:** Tokens são inseridos em `revoked_tokens` no logout mas nunca removidos após expiração. Com tokens de 1h de duração, o crescimento é lento, mas a tabela crescerá indefinidamente. A query de revogação usa lookup por PK (`jti`) pelo que o impacto de performance é baixo. O risco é de acumulação de dados desnecessários.  
**Correção:** Agendar limpeza periódica via Supabase cron (pg_cron) ou adicionar cleanup no handler de logout:
```sql
-- Supabase pg_cron (executar 1x/dia):
SELECT cron.schedule('cleanup-revoked-tokens', '0 3 * * *',
  $$DELETE FROM revoked_tokens WHERE expires_at < NOW()$$);
```

---

### INFO-01 — Fallback `x-real-ip` → `'unknown'` partilha bucket de rate limit em dev

**Ficheiro:** `src/lib/rate-limit.ts:9`  
**Descrição:** Em ambientes sem proxy (desenvolvimento, CI), todos os clientes partilham a chave `login:unknown`. 5 tentativas falhadas de login esgotam o rate limit para todos. Em produção com Vercel/Nginx, `x-real-ip` é sempre definido pelo proxy, pelo que o impacto é nulo. A variável `RATE_LIMIT_DISABLED=true` mitiga o problema em CI.  
**Ação:** Nenhuma necessária em produção. Documentar o comportamento no README para developers locais.

---

## Testes E2E — Gaps de Cobertura de Segurança

Os testes existentes cobrem bem os fluxos funcionais. Faltam os seguintes testes de segurança:

### Proposta de novos testes (`tests/e2e/security.spec.ts`)

```typescript
// 1. Security Headers
test('response includes required security headers', async ({ request }) => {
  const res = await request.get('/');
  expect(res.headers()['x-frame-options']).toBe('DENY');
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  expect(res.headers()['content-security-policy']).toContain("default-src 'self'");
  // Após correção MEDIUM-01:
  // expect(res.headers()['strict-transport-security']).toContain('max-age=');
});

// 2. CSRF — rejeitar mutações sem Origin
test('API rejects POST without Origin header', async ({ request }) => {
  const res = await request.post('/api/reservations', {
    headers: { 'Content-Type': 'application/json' },
    // Sem 'Origin' header
    data: JSON.stringify({ menu_item_id: 'invalid', customer_name: 'x', customer_phone: '123', quantity: 1 }),
  });
  expect(res.status()).toBe(403);
});

// 3. UUID obrigatório nos path params
test('API rejects non-UUID IDs in path params', async ({ request }) => {
  const res = await request.patch('/api/reservations/not-a-uuid/confirm', {
    headers: { Origin: 'http://localhost:3000' },
  });
  expect(res.status()).toBe(400);
});

// 4. Payload demasiado grande
test('API rejects oversized request bodies', async ({ request }) => {
  const res = await request.post('/api/reservations', {
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
    data: JSON.stringify({ menu_item_id: 'x', customer_name: 'A'.repeat(6000), customer_phone: '123', quantity: 1 }),
  });
  expect(res.status()).toBe(413);
});

// 5. Autenticação — acesso a rota admin bloqueado sem cookie
test('GET /api/reservations returns 401 without session', async ({ request }) => {
  const res = await request.get('/api/reservations');
  expect(res.status()).toBe(401);
});

// 6. /obrigado com UUID inexistente redireciona para /
test('obrigado page with unknown UUID redirects to home', async ({ page }) => {
  const fakeUuid = '00000000-0000-0000-0000-000000000000';
  await page.goto(`/obrigado?id=${fakeUuid}`);
  await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
});
```

---

## Checklist de Remediação

| ID | Severidade | Estado | Prazo sugerido |
|----|-----------|--------|----------------|
| MEDIUM-01 | Médio | Aberto | Sprint atual |
| MEDIUM-02 | Médio | Aberto | Sprint atual |
| MEDIUM-03 | Médio | Aberto | Próximo ciclo |
| MEDIUM-04 | Médio | Aberto | Sprint atual |
| LOW-01 | Baixo | Aberto | A avaliar |
| LOW-02 | Baixo | Aberto | Próximo ciclo |
| LOW-03 | Baixo | Aberto | Próximo ciclo |
| INFO-01 | Informativo | Aceite | — |

---

## Próximos Passos Recomendados

1. **Imediato (1-2 dias):** Corrigir MEDIUM-01 (HSTS) e MEDIUM-02 (RLS `login_attempts`) — ambas são mudanças de 3-5 linhas com impacto zero em funcionalidade.
2. **Sprint atual:** MEDIUM-04 (validação de telefone) e criar `tests/e2e/security.spec.ts` com os testes propostos.
3. **Próximo ciclo:** MEDIUM-03 (CSP nonces), LOW-02 (timezone), LOW-03 (pg_cron cleanup).
4. **A avaliar:** LOW-01 (PII em URL) — depende de decisão de produto sobre o fluxo pós-reserva.
