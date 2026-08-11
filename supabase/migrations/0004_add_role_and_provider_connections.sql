-- DentalTracker Database Schema Update
-- Migration: 0004_add_role_and_provider_connections.sql
-- Description: Add role to profiles, create provider_connections table, and set up RLS for provider access

-- 1. Add role column to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'patient'
  CHECK (role IN ('patient', 'provider'));

-- 2. Create provider_connections table
CREATE TABLE IF NOT EXISTS provider_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ NULL
);

-- 3. Create partial unique index to prevent duplicate active connections
CREATE UNIQUE INDEX idx_unique_active_provider_connection
  ON provider_connections (patient_id, provider_id)
  WHERE status = 'active';

-- 4. Enable RLS on provider_connections and set policies
ALTER TABLE provider_connections ENABLE ROW LEVEL SECURITY;

-- Patients can manage their own provider connections (select, insert, update to revoke)
CREATE POLICY "Patients can manage their own provider connections"
  ON provider_connections
  FOR ALL
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- Providers can view their patient connections (select only)
CREATE POLICY "Providers can view their patient connections"
  ON provider_connections
  FOR SELECT
  USING (provider_id = auth.uid());

-- 5. Add provider read access policies to tooth_records (additive, does not modify existing patient policies)
CREATE POLICY "Providers can view tooth records of their patients"
  ON tooth_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_connections
      WHERE provider_id = auth.uid()
        AND patient_id = user_id
        AND status = 'active'
    )
  );

-- 6. Add provider read access policies to appointments (additive, does not modify existing patient policies)
CREATE POLICY "Providers can view appointments of their patients"
  ON appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_connections
      WHERE provider_id = auth.uid()
        AND patient_id = user_id
        AND status = 'active'
    )
  );