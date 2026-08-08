-- DentalTracker Database Schema Update
-- Migration: 0003_add_reminder_sent.sql
-- Description: Add reminder_sent column to appointments table to track which appointments have had reminders sent

-- Add reminder_sent column to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Update table comment
COMMENT ON COLUMN public.appointments.reminder_sent IS 'Flag indicating whether a reminder email has been sent for this appointment';

-- Create index for better query performance on reminder_sent and appointment_date
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_sent_date ON public.appointments(reminder_sent, appointment_date);