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
# Preencher ADMIN_PASSWORD e AUTH_SECRET (ver comentários no ficheiro)
```

### 3. Iniciar a base de dados local

```bash
npm run db:start
# Inicia os containers Docker do Supabase e atualiza .env.local automaticamente
```

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

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

Para aplicar em produção: executar o ficheiro SQL no Supabase SQL Editor.

---

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (nunca expor ao browser) |
| `ADMIN_PASSWORD` | Senha de acesso à área `/admin` |
| `AUTH_SECRET` | Segredo JWT — gerar com `openssl rand -hex 32` |
| `MBWAY_PHONE` | Número MBWay para receber pagamentos |

---

## Deploy (produção)

### Supabase
1. Criar projeto em [supabase.com](https://supabase.com) → região Europa
2. SQL Editor → executar as migrations em `supabase/migrations/` por ordem
3. Settings > API → copiar URL e chaves

### Vercel
1. Push para GitHub
2. Importar repositório em [vercel.com](https://vercel.com)
3. Adicionar as variáveis de ambiente no painel do Vercel
4. Deploy automático a cada `git push main`
