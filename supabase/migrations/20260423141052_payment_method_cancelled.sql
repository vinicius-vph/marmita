ALTER TABLE reservations
  ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'mbway'
    CHECK (payment_method IN ('mbway', 'cash', 'transfer'));

ALTER TABLE reservations
  ADD COLUMN cancelled BOOLEAN NOT NULL DEFAULT false;

-- Recriar view excluindo reservas canceladas dos totais de angariação
DROP VIEW IF EXISTS fundraising_summary;
CREATE VIEW fundraising_summary AS
SELECT
  fc.category,
  fc.goal,
  fc.label,
  COALESCE(fc.manual_raised, 0)
    + COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true AND r.cancelled = false), 0) AS raised,
  fc.goal
    - (COALESCE(fc.manual_raised, 0)
    + COALESCE(SUM(r.total_amount) FILTER (WHERE r.paid = true AND r.cancelled = false), 0)) AS remaining
FROM fundraising_config fc
LEFT JOIN menu_items mi ON mi.category = fc.category
LEFT JOIN reservations r ON r.menu_item_id = mi.id
GROUP BY fc.id, fc.category, fc.goal, fc.label, fc.manual_raised;
