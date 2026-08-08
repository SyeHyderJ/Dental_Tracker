-- DentalTracker Database Schema Update
-- Migration: 0002_add_provider_to_records.sql
-- Description: Add provider_name column to tooth_records table for tracking which provider performed the treatment

-- Add provider_name column to tooth_records table
ALTER TABLE public.tooth_records
ADD COLUMN IF NOT EXISTS provider_name TEXT;

-- Update table comment
COMMENT ON COLUMN public.tooth_records.provider_name IS 'Name of the dental provider who performed the treatment';

-- Create index for better query performance on provider_name
CREATE INDEX IF NOT EXISTS idx_tooth_records_provider_name ON public.tooth_records(provider_name);