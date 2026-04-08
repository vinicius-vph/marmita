# Plano: Aplicação Marmita — Angariação de Fundos Religiosa

## Contexto

Uma instituição religiosa portuguesa vende refeições para angariar fundos para obras no templo de culto. Precisam de uma aplicação web simples, com área pública (menu, reservas, progresso da angariação) e área de gestão (admin). O deploy deve ser gratuito.

---

## Stack Técnica

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (PostgreSQL, free tier) — base de dados
- **Vercel** (free tier) — hosting
- Auth admin: cookie JWT assinado com `jose`, senha via env var
- Sem frameworks extra desnecessários

---

## Estrutura de Ficheiros

```
marmita/
├── .env.example
├── .gitignore
├── middleware.ts                    # Protege /admin (Edge JWT check)
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                 # Homepage pública (server component)
    │   ├── obrigado/page.tsx        # Pós-reserva: instruções MBWay
    │   ├── admin/
    │   │   ├── login/page.tsx
    │   │   ├── layout.tsx
    │   │   ├── page.tsx             # Dashboard: lista de reservas + confirmar
    │   │   ├── menu/page.tsx        # CRUD menu semanal
    │   │   └── meta/page.tsx        # Definir objetivo de angariação
    │   └── api/
    │       ├── reservations/route.ts            # POST criar reserva
    │       ├── reservations/[id]/confirm/route.ts # PATCH confirmar pagamento
    │       ├── menu/route.ts                    # GET público + POST admin
    │       ├── menu/[id]/route.ts               # PUT + soft-DELETE admin
    │       ├── fundraising/route.ts             # GET summary público
    │       ├── admin/login/route.ts             # POST validar senha → cookie
    │       └── admin/meta/route.ts              # PUT atualizar objetivo
    ├── components/
    │   ├── public/
    │   │   ├── MenuSection.tsx      # Grid de pratos da semana
    │   │   ├── MenuCard.tsx         # Card individual do prato
    │   │   ├── ReservationForm.tsx  # Formulário (client component)
    │   │   └── FundraisingTracker.tsx # Barra de progresso
    │   └── admin/
    │       ├── ReservationsTable.tsx
    │       ├── MenuForm.tsx
    │       ├── MenuList.tsx
    │       └── GoalForm.tsx
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts            # Browser client (anon key)
    │   │   └── server.ts            # Server client (service_role key)
    │   ├── auth.ts                  # signAdminToken, verifyAdminToken, getAdminSession
    │   └── utils.ts                 # formatCurrency, formatDate (pt locale)
    └── types/index.ts
```

---

## Schema da Base de Dados (Supabase SQL)

```sql
CREATE TABLE menu_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(8,2) NOT NULL CHECK (price > 0),
  meal_date   DATE NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  total_amount    NUMERIC(8,2) NOT NULL,  -- snapshot: quantity × price
  paid            BOOLEAN NOT NULL DEFAULT false,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fundraising_config (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  goal       NUMERIC(10,2) NOT NULL DEFAULT 5000.00,
  label      TEXT NOT NULL DEFAULT 'Obras do Templo',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO fundraising_config (id, goal, label) VALUES (1, 5000.00, 'Obras do Templo');

-- View para calcular o total angariado dinamicamente
CREATE OR REPLACE VIEW fundraising_summary AS
SELECT
  fc.goal, fc.label,
  COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true), 0) AS raised,
  fc.goal - COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true), 0) AS remaining
FROM fundraising_config fc
LEFT JOIN reservations r ON true
GROUP BY fc.goal, fc.label;

-- RLS: apenas leitura pública nos menu_items
ALTER TABLE menu_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraising_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active menu" ON menu_items
  FOR SELECT USING (active = true);
```

---

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # nunca exposto ao browser
ADMIN_PASSWORD=senha-segura-aqui
AUTH_SECRET=string-aleatoria-32-bytes  # openssl rand -hex 32
MBWAY_PHONE=+351968326760
```

---

## Funcionalidades Principais

### 1. Homepage Pública (Server Component)
- `<FundraisingTracker>` — barra animada: Angariado / Objetivo / Falta
- `<MenuSection>` — cards dos pratos da semana com nome, descrição, preço e data
- `<ReservationForm>` — campos: prato (select), nome, telefone, quantidade
- Submit → POST `/api/reservations` → redireciona para `/obrigado`

### 2. Página `/obrigado`
- Mostra: nome, prato, quantidade, total a pagar
- Instruções MBWay:
  ```
  Abra o MBWay → Enviar Dinheiro → +351 968 326 760
  Valor: €XX,XX | Referência: [nome do cliente]
  ```

### 3. API de Reservas (`POST /api/reservations`)
- Busca preço atual do prato no Supabase
- Calcula `total_amount = quantity × price` server-side (evita manipulação)
- Insere na tabela `reservations`

### 4. Middleware de Auth (`src/middleware.ts`)
- Protege todas as rotas `/admin/*` exceto `/admin/login`
- Verifica cookie `admin_session` com JWT usando `jose` (Edge-compatible)
- Redireciona para `/admin/login` se inválido/ausente

### 5. Admin — Dashboard
- Lista de reservas com filtros: Todos / Pendentes / Confirmados
- Botão "Confirmar Pagamento" → PATCH `/api/reservations/[id]/confirm`
- Marcar como pago atualiza automaticamente o total via `fundraising_summary` view

### 6. Admin — Menu
- Formulário: nome, descrição, preço, data da refeição
- Soft-delete (active = false) para preservar histórico

### 7. Admin — Objetivo
- Input simples para atualizar `fundraising_config.goal`
- Mostra resumo atual (angariado, restante)

---

## Design Visual
- Paleta: tons quentes (`amber-700` para botões, `stone-50` fundo, branco para cards)
- Tipografia: fonte serif para títulos (`Lora` via `next/font`)
- Mobile-first, grids responsivos
- Admin: minimalista, `slate-800`

---

## Dependências

```bash
npm install @supabase/supabase-js jose date-fns react-hot-toast
```

---

## Deploy (Gratuito)

### Supabase (~10 min)
1. Criar conta em supabase.com
2. Novo projeto → região Europa (eu-west-1)
3. SQL Editor → executar schema acima
4. Settings > API → copiar URL e chaves

### Vercel (~5 min)
1. Push do código para GitHub
2. Importar repositório no vercel.com
3. Adicionar todas as env vars no painel
4. Deploy automático a cada `git push main`

### Comandos de Setup Local
```bash
npx create-next-app@latest marmita --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd marmita
npm install @supabase/supabase-js jose date-fns react-hot-toast
cp .env.example .env.local  # preencher com valores reais
npm run dev
```

---

## Ordem de Implementação

1. `src/types/index.ts`
2. `src/lib/supabase/server.ts` + `client.ts`
3. `src/lib/auth.ts` + `utils.ts`
4. `src/middleware.ts`
5. API routes (GET menu, GET fundraising, POST reservations)
6. Componentes públicos (MenuCard, MenuSection, FundraisingTracker)
7. ReservationForm + página /obrigado
8. Admin login + middleware
9. Admin dashboard (ReservationsTable + confirm)
10. Admin menu CRUD
11. Admin meta/objetivo

---

## Verificação Final

- [ ] Menu exibe pratos da semana na homepage
- [ ] Reserva cria registo + redireciona para /obrigado com instruções MBWay
- [ ] Total MBWay calculado server-side (quantity × price correto)
- [ ] Login admin com senha funciona, cookie expira em 8h
- [ ] Confirmar pagamento no admin atualiza barra de progresso
- [ ] Deploy no Vercel funcional com env vars configuradas
- [ ] Testado em mobile (dispositivo principal dos visitantes)
