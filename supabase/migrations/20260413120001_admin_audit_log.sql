CREATE TABLE IF NOT EXISTS admin_audit_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action     TEXT        NOT NULL,
  entity_id  TEXT,
  payload    JSONB,                  
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx
  ON admin_audit_log (action);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON admin_audit_log (created_at);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to admin_audit_log"
  ON admin_audit_log FOR ALL
  USING (false)
  WITH CHECK (false);
