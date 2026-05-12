ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to login_attempts"
  ON login_attempts FOR ALL
  USING (false)
  WITH CHECK (false);
