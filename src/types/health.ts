export type Severity = 'mild' | 'moderate' | 'severe';
export type HistoryCategory = 'condition' | 'surgery' | 'dental' | 'other';
export type DocumentCategory = 'xray' | 'insurance' | 'referral' | 'other';

export interface Allergy {
  id: string;
  user_id: string;
  allergen: string;
  reaction: string | null;
  severity: Severity;
  notes: string | null;
  created_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dose: string | null;
  schedule: string | null;
  reason: string | null;
  active: boolean;
  created_at: string;
}

export interface MedicalHistory {
  id: string;
  user_id: string;
  title: string;
  category: HistoryCategory;
  onset_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface PatientDocument {
  id: string;
  user_id: string;
  filename: string;
  mime: string;
  storage_path: string;
  category: DocumentCategory;
  uploaded_at: string;
}
