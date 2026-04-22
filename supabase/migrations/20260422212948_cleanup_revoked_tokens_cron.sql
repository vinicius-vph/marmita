-- Remove expired entries from revoked_tokens daily at 03:00 UTC.
-- pg_cron must be enabled in Supabase: Dashboard → Database → Extensions → pg_cron.
-- If pg_cron is not available, run the DELETE statement manually or via a Supabase scheduled function.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'cleanup-revoked-tokens',
      '0 3 * * *',
      $$DELETE FROM revoked_tokens WHERE expires_at < NOW()$$
    );
  END IF;
END;
$$;
