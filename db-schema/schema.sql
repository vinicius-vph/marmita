-- ================================================================
-- Schema completo — Marmita Solidária
-- Para instalação nova: executar este ficheiro.
-- Para base de dados existente: correr as migrações em db-schema/migrations/
-- ================================================================

-- Pratos do menu semanal
CREATE TABLE menu_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(8,2) NOT NULL CHECK (price > 0),
  meal_date   DATE NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reservas dos clientes
CREATE TABLE reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  total_amount    NUMERIC(8,2) NOT NULL,
  paid            BOOLEAN NOT NULL DEFAULT false,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuração da campanha (tabela de linha única)
CREATE TABLE fundraising_config (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  goal          NUMERIC(10,2) NOT NULL DEFAULT 5000.00,
  label         TEXT NOT NULL DEFAULT 'Obras do Templo',
  manual_raised NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO fundraising_config (id, goal, label, manual_raised)
VALUES (1, 5000.00, 'Obras do Templo', 0);

-- View do resumo da angariação
-- raised = donativos manuais + reservas confirmadas
CREATE VIEW fundraising_summary AS
SELECT
  fc.goal,
  fc.label,
  COALESCE(fc.manual_raised, 0) + COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true), 0) AS raised,
  fc.goal - (COALESCE(fc.manual_raised, 0) + COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true), 0)) AS remaining
FROM fundraising_config fc
LEFT JOIN reservations r ON true
GROUP BY fc.goal, fc.label, fc.manual_raised;

-- ================================================================
-- Row Level Security
-- Escritas feitas server-side com service_role (bypass RLS)
-- ================================================================
ALTER TABLE menu_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraising_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active menu" ON menu_items
  FOR SELECT USING (active = true);

-- ================================================================
-- Supabase Storage — bucket público para imagens dos pratos
-- ================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read menu images" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');
