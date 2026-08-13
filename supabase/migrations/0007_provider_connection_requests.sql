-- DentalTracker Database Schema Update
-- Migration: 0007_provider_connection_requests.sql
-- Description: Add provider-initiated connection requests (pending status) and patient lookup function with rate limiting

-- 1. Create table to track provider lookup attempts for rate limiting
CREATE TABLE IF NOT EXISTS provider_lookup_attempts (
  provider_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE provider_lookup_attempts ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies added: this table should only ever be written to
-- by the SECURITY DEFINER function, never queried directly by clients.

CREATE INDEX IF NOT EXISTS idx_provider_lookup_attempts_provider_time
  ON provider_lookup_attempts (provider_id, attempted_at);

-- 2. Update provider_connections table
ALTER TABLE provider_connections
  ADD COLUMN IF NOT EXISTS initiated_by TEXT NOT NULL DEFAULT 'patient'
    CHECK (initiated_by IN ('patient', 'provider')),
  ALTER COLUMN status SET DEFAULT 'active',
  DROP CONSTRAINT IF EXISTS provider_connections_status_check,
  ADD CONSTRAINT provider_connections_status_check
    CHECK (status IN ('active', 'revoked', 'pending'));

-- 3. Update RLS policies
DROP POLICY IF EXISTS "Patients can manage their own provider connections" ON provider_connections;
DROP POLICY IF EXISTS "Providers can view their patient connections" ON provider_connections;
DROP POLICY IF EXISTS "Providers can insert pending connection requests" ON provider_connections;

CREATE POLICY "Patients can manage their own provider connections"
  ON provider_connections
  FOR ALL
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Providers can view their patient connections"
  ON provider_connections
  FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "Providers can insert pending connection requests"
  ON provider_connections
  FOR INSERT
  WITH CHECK (
    provider_id = auth.uid() AND
    initiated_by = 'provider' AND
    status = 'pending'
  );

-- 4. Security definer function to look up patient by email with rate limiting
CREATE OR REPLACE FUNCTION find_patient_by_email(lookup_email TEXT)
RETURNS TABLE(patient_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  INSERT INTO provider_lookup_attempts (provider_id) VALUES (auth.uid());

  SELECT COUNT(*) INTO attempt_count
  FROM provider_lookup_attempts
  WHERE provider_id = auth.uid()
    AND attempted_at >= now() - interval '1 hour';

  IF attempt_count > 10 THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT p.id
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email = lookup_email;
END;
$$;

GRANT EXECUTE ON FUNCTION find_patient_by_email TO authenticated;