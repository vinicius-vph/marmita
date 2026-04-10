-- ================================================================
-- 003 — Valor angariado manual em fundraising_config
--       Permite registar donativos recebidos fora da plataforma.
-- ================================================================

ALTER TABLE fundraising_config
  ADD COLUMN IF NOT EXISTS manual_raised NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Recriar view para incluir manual_raised no total angariado
CREATE OR REPLACE VIEW fundraising_summary AS
SELECT
  fc.goal,
  fc.label,
  COALESCE(fc.manual_raised, 0) + COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true), 0) AS raised,
  fc.goal - (COALESCE(fc.manual_raised, 0) + COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true), 0)) AS remaining
FROM fundraising_config fc
LEFT JOIN reservations r ON true
GROUP BY fc.goal, fc.label, fc.manual_raised;
