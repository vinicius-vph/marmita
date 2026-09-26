-- Expand step: customer name/phone are stored encrypted (AES-256-GCM, done in the app).
-- The plaintext columns stay for now (nullable) so the backfill can run before they are dropped.
ALTER TABLE reservations
  ADD COLUMN customer_name_enc  TEXT,
  ADD COLUMN customer_phone_enc TEXT,
  ALTER COLUMN customer_name  DROP NOT NULL,
  ALTER COLUMN customer_phone DROP NOT NULL,
  ADD CONSTRAINT reservations_customer_name_present
    CHECK (customer_name IS NOT NULL OR customer_name_enc IS NOT NULL),
  ADD CONSTRAINT reservations_customer_phone_present
    CHECK (customer_phone IS NOT NULL OR customer_phone_enc IS NOT NULL);
