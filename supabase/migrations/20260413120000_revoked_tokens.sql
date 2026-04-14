-- Denylist for revoked JWT tokens (SEC-11)
-- Tokens are added here on logout to enable immediate invalidation.
-- Rows expire naturally after token expiry (1h); they are kept for auditing purposes.

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti       TEXT        PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS revoked_tokens_expires_at_idx
  ON revoked_tokens (expires_at);

ALTER TABLE revoked_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to revoked_tokens"
  ON revoked_tokens FOR ALL
  USING (false)
  WITH CHECK (false);
