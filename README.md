# Marmita Solidária

Aplicação web para venda de refeições e angariação de fundos para obras do templo.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (PostgreSQL) — base de dados
- **Vercel** — hosting gratuito
- Auth admin via cookie JWT (`jose`), sem biblioteca de auth extra

---

## Pré-requisitos

- Node.js 18+
- Docker (para base de dados local)

---

## Setup local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Preencher ADMIN_PASSWORD_HASH e AUTH_SECRET (ver comentários no ficheiro)
```

### 3. Iniciar a base de dados local

```bash
npm run db:start
# Inicia os containers Docker do Supabase e atualiza .env.local automaticamente
```

> Alternativa recomendada: `npm run dev:cli -- up` arranca só os containers necessários **e** o Next.js. Ver [docs/operations/local-dev.md](docs/operations/local-dev.md).

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Abrir [http://localhost:28417](http://localhost:28417) (porta fixa fora do range 3xxx para não colidir com outros projetos).

---

## Comandos da base de dados

| Comando | Descrição |
|---|---|
| `npm run db:start` | Inicia Supabase local + atualiza `.env.local` com as chaves locais |
| `npm run db:stop` | Para os containers Docker |
| `npm run db:reset` | Recria a DB do zero (migrations + seed) |
| `npm run db:status` | Mostra URLs e chaves do ambiente local |

---

## Migrations

As migrations ficam em `supabase/migrations/` com o formato do Supabase CLI:

```
supabase/migrations/YYYYMMDDHHmmss_descricao.sql
```

Para criar uma nova migration:

```bash
npx supabase migration new descricao_da_alteracao
# Cria o ficheiro com o timestamp correto em supabase/migrations/
```

Após criar e editar o ficheiro, aplicar localmente:

```bash
npm run db:reset
```

Em produção, o workflow `.github/workflows/migrate.yml` corre `scripts/migrate.js` a cada push para `main` que altere `supabase/migrations/**`. O script aplica só as migrations pendentes (regista-as em `supabase_migrations.schema_migrations`). Se falhar, executar o ficheiro SQL manualmente no Supabase SQL Editor.

---

## Funcionalidades

- **Público:** menu de pratos, reserva com escolha de método de pagamento (MBWay, transferência bancária/IBAN ou numerário), progresso da angariação, PT/EN/ES.
- **Admin (`/admin`):** dashboard de reservas com filtros (estado, prato, método de pagamento, data), confirmação de pagamento, cancelamento de reservas, relatório em PDF e Excel, gestão de pratos e do objetivo de angariação.
- **Módulo Café da Manhã (`breakfast`):** desativado por defeito — ver `NEXT_PUBLIC_ENABLED_FEATURES`.

---

## Testes E2E

```bash
npm run test:e2e        # Playwright (arranca `npm run dev` se não estiver ativo)
npm run test:e2e:ui     # modo interativo
```

Os testes de admin precisam de `ADMIN_PASSWORD` (password em texto simples correspondente ao `ADMIN_PASSWORD_HASH`) no ambiente. Definir `RATE_LIMIT_DISABLED=true` em CI para não poluir a tabela `login_attempts`.

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave de serviço (nunca expor ao browser) |
| `ADMIN_PASSWORD_HASH` | Sim | Hash bcrypt da password de `/admin`, codificado em base64 (comando de geração em `.env.example`) |
| `AUTH_SECRET` | Sim | Segredo JWT, mín. 32 caracteres — gerar com `openssl rand -hex 32` |
| `PII_ENCRYPTION_KEY` | Sim | 32 bytes em base64 que cifram nome/telemóvel dos clientes. Ver [docs/operations/pii-encryption.md](docs/operations/pii-encryption.md) |
| `MBWAY_PHONE` | Não | Número MBWay para receber pagamentos |
| `BANK_IBAN` | Não | IBAN mostrado na página `/obrigado` para pagamentos por transferência |
| `WHATSAPP_PHONE` | Não | Número WhatsApp do footer |
| `INSTAGRAM_URL` / `FACEBOOK_URL` | Não | Links das redes sociais no footer |
| `NEXT_PUBLIC_ENABLED_FEATURES` | Não | Lista separada por vírgulas de features opt-in. Vazio = todas desligadas. Valor válido: `breakfast` |
| `RATE_LIMIT_DISABLED` | Não | `true` em CI/testes para ignorar o rate limit |
| `ALLOWED_DEV_ORIGINS` | Não | Só em dev — origens permitidas (default `127.0.0.1,localhost`) |
| `SUPABASE_ACCESS_TOKEN` / `SUPABASE_PROJECT_REF` | Só CI | Secrets do GitHub usados por `scripts/migrate.js` |

---

## Deploy (produção)

### Supabase
1. Criar projeto em [supabase.com](https://supabase.com) → região Europa
2. Definir os secrets `SUPABASE_ACCESS_TOKEN` e `SUPABASE_PROJECT_REF` no GitHub — as migrations são aplicadas automaticamente pelo workflow (ver [Migrations](#migrations))
3. Settings > API → copiar URL e chaves

### Vercel
1. Push para GitHub
2. Importar repositório em [vercel.com](https://vercel.com)
3. Adicionar as variáveis de ambiente no painel do Vercel
4. Deploy automático a cada `git push main`
