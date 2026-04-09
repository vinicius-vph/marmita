-- ================================================================
-- 002 — Adicionar coluna image_url à tabela menu_items
-- ================================================================

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;
