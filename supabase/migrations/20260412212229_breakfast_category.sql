-- ================================================================
-- 004 — Categoria: refeições e café da manhã
--       Permite gerir dois módulos independentes com objetivos
--       de angariação separados.
-- ================================================================

-- Adicionar coluna category a menu_items (default 'meals' para itens existentes)
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'meals'
  CHECK (category IN ('meals', 'breakfast'));

-- Remover constraint de linha única em fundraising_config
ALTER TABLE fundraising_config DROP CONSTRAINT IF EXISTS single_row;

-- Adicionar coluna category a fundraising_config
ALTER TABLE fundraising_config
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'meals'
  CHECK (category IN ('meals', 'breakfast'));

-- Garantir unicidade por categoria
ALTER TABLE fundraising_config
  ADD CONSTRAINT fundraising_config_category_unique UNIQUE (category);

-- Inserir configuração do café da manhã
INSERT INTO fundraising_config (id, goal, label, manual_raised, category)
VALUES (2, 1000.00, 'Café da Manhã Solidário', 0, 'breakfast')
ON CONFLICT (id) DO NOTHING;

-- Recriar view com suporte a categorias independentes
-- DROP necessário porque CREATE OR REPLACE VIEW não pode reordenar/adicionar colunas
DROP VIEW IF EXISTS fundraising_summary;

CREATE VIEW fundraising_summary AS
SELECT
  fc.category,
  fc.goal,
  fc.label,
  COALESCE(fc.manual_raised, 0)
    + COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true), 0) AS raised,
  fc.goal
    - (COALESCE(fc.manual_raised, 0)
    + COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true), 0)) AS remaining
FROM fundraising_config fc
LEFT JOIN menu_items mi ON mi.category = fc.category
LEFT JOIN reservations r ON r.menu_item_id = mi.id
GROUP BY fc.id, fc.category, fc.goal, fc.label, fc.manual_raised;
