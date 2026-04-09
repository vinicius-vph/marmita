-- ================================================================
-- Schema da base de dados — Marmita Solidária
-- Executar no SQL Editor do Supabase
-- ================================================================

-- Pratos do menu semanal
CREATE TABLE menu_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(8,2) NOT NULL CHECK (price > 0),
  meal_date   DATE NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reservas dos clientes
CREATE TABLE reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  total_amount    NUMERIC(8,2) NOT NULL,  -- snapshot: quantity × price no momento da reserva
  paid            BOOLEAN NOT NULL DEFAULT false,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuração da campanha (tabela de linha única)
CREATE TABLE fundraising_config (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  goal       NUMERIC(10,2) NOT NULL DEFAULT 5000.00,
  label      TEXT NOT NULL DEFAULT 'Obras do Templo',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir linha de configuração inicial
INSERT INTO fundraising_config (id, goal, label) VALUES (1, 5000.00, 'Obras do Templo');

-- View para calcular o total angariado dinamicamente
CREATE OR REPLACE VIEW fundraising_summary AS
SELECT
  fc.goal,
  fc.label,
  COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true), 0) AS raised,
  fc.goal - COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true), 0) AS remaining
FROM fundraising_config fc
LEFT JOIN reservations r ON true
GROUP BY fc.goal, fc.label;

-- ================================================================
-- Row Level Security (RLS)
-- Escritas feitas server-side com service_role key (bypass RLS)
-- ================================================================
ALTER TABLE menu_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraising_config ENABLE ROW LEVEL SECURITY;

-- Leitura pública apenas dos pratos ativos
CREATE POLICY "Public read active menu" ON menu_items
  FOR SELECT USING (active = true);

-- ================================================================
-- MIGRAÇÃO (executar se a tabela menu_items já existia)
-- ================================================================
-- ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ================================================================
-- Supabase Storage — bucket para imagens dos pratos
-- Executar no SQL Editor do Supabase
-- ================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública das imagens
CREATE POLICY "Public read menu images" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

-- Gestão das imagens apenas via service_role (API server-side)
-- (service_role bypassa RLS automaticamente)

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;