-- 0006_provider_patient_list.sql

-- 1. Create function to get my patients (provider's active connections)
CREATE OR REPLACE FUNCTION get_my_patients()
RETURNS TABLE(patient_id UUID, patient_name TEXT, connected_since TIMESTAMPTZ)
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pc.patient_id, p.full_name, pc.created_at
  FROM provider_connections pc
  JOIN profiles p ON p.id = pc.patient_id
  WHERE pc.provider_id = auth.uid() AND pc.status = 'active';
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION get_my_patients TO authenticated;