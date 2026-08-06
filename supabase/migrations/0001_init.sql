-- DentalTracker Database Schema
-- Migration: 0001_init.sql
-- Description: Initial schema setup with profiles, tooth_records, and appointments tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table - stores user profile information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);

-- Tooth records table - stores dental health records
CREATE TABLE IF NOT EXISTS public.tooth_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    tooth_number INTEGER NOT NULL CHECK (tooth_number BETWEEN 1 AND 32),
    condition TEXT NOT NULL, -- e.g., 'healthy', 'cavity', 'filling', 'crown', 'missing'
    notes TEXT,
    date DATE NOT NULL, -- Date of the observation/checkup
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security on tooth_records
ALTER TABLE public.tooth_records ENABLE ROW LEVEL SECURITY;

-- Create policies for tooth_records
CREATE POLICY "Users can view their own tooth records" ON public.tooth_records
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tooth records" ON public.tooth_records
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tooth records" ON public.tooth_records
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tooth records" ON public.tooth_records
    FOR DELETE
    USING (auth.uid() = user_id);

-- Appointments table - stores dental appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    provider_name TEXT NOT NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Users can view their own appointments" ON public.appointments
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments" ON public.appointments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" ON public.appointments
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" ON public.appointments
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, created_at, updated_at)
    VALUES (NEW.id, NULL, NULL, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tooth_records_user_id ON public.tooth_records(user_id);
CREATE INDEX IF NOT EXISTS idx_tooth_records_date ON public.tooth_records(date);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);

-- Comments for documentation
COMMENT ON TABLE public.profiles IS 'User profile information';
COMMENT ON TABLE public.tooth_records IS 'Dental health records for individual teeth';
COMMENT ON TABLE public.appointments IS 'Dental appointments with providers';
COMMENT ON COLUMN public.tooth_records.condition IS 'Condition of the tooth (healthy, cavity, filling, crown, missing, etc.)';