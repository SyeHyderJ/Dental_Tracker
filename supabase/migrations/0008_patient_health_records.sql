-- Patient health records: allergies, medications, history, documents, and private storage.

CREATE TABLE IF NOT EXISTS public.allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  reaction TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT,
  schedule TEXT,
  reason TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.medical_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('condition', 'surgery', 'dental', 'other')),
  onset_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('xray', 'insurance', 'referral', 'other')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage own allergies" ON public.allergies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can view patient allergies" ON public.allergies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.provider_connections
      WHERE provider_id = auth.uid()
        AND patient_id = user_id
        AND status = 'active'
    )
  );

CREATE POLICY "Patients can manage own medications" ON public.medications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can view patient medications" ON public.medications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.provider_connections
      WHERE provider_id = auth.uid()
        AND patient_id = user_id
        AND status = 'active'
    )
  );

CREATE POLICY "Patients can manage own medical history" ON public.medical_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can view patient medical history" ON public.medical_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.provider_connections
      WHERE provider_id = auth.uid()
        AND patient_id = user_id
        AND status = 'active'
    )
  );

CREATE POLICY "Patients can manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can view patient documents" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.provider_connections
      WHERE provider_id = auth.uid()
        AND patient_id = user_id
        AND status = 'active'
    )
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Patients can upload own files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Patients can read own files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Patients can delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Providers can read connected patient files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND EXISTS (
      SELECT 1 FROM public.provider_connections
      WHERE provider_id = auth.uid()
        AND patient_id = ((storage.foldername(name))[1])::uuid
        AND status = 'active'
    )
  );
