-- DentalTracker Database Schema Update
-- Migration: 0005_provider_lookup_and_connection_view.sql
-- Description: Add secure provider lookup function and connection view function for Share Access feature

-- 1. Function to find provider by email (only returns if role = 'provider')
CREATE OR REPLACE FUNCTION find_provider_by_email(lookup_email TEXT)
RETURNS TABLE(provider_id UUID, provider_name TEXT)
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = lookup_email AND p.role = 'provider';
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION find_provider_by_email TO authenticated;

-- 2. Function to get my provider connections with provider names
CREATE OR REPLACE FUNCTION get_my_provider_connections()
RETURNS TABLE(connection_id UUID, provider_id UUID, provider_name TEXT, status TEXT, created_at TIMESTAMPTZ)
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pc.id, pc.provider_id, p.full_name, pc.status, pc.created_at
  FROM provider_connections pc
  JOIN profiles p ON p.id = pc.provider_id
  WHERE pc.patient_id = auth.uid();
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION get_my_provider_connections TO authenticated;