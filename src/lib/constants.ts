// Common allergies and medications for dropdown selection
// Dental/medical focused lists with "Other" option for free-text entry

export const COMMON_ALLERGIES = [
  'Penicillin',
  'Amoxicillin',
  'Cephalosporins',
  'Sulfa Drugs',
  'Latex',
  'Local Anesthetics (Lidocaine)',
  'NSAIDs (Ibuprofen, Aspirin)',
  'Acetaminophen',
  'Codeine',
  'Erythromycin',
  'Clindamycin',
  'Metals (Nickel, Gold)',
  'Acrylics',
  'Eugenol',
  'Other...'
] as const;

export const COMMON_MEDICATIONS = [
  'Amoxicillin',
  'Penicillin VK',
  'Clindamycin',
  'Azithromycin',
  'Metronidazole',
  'Ibuprofen',
  'Acetaminophen',
  'Naproxen',
  'Prednisone',
  'Dexamethasone',
  'Lidocaine',
  'Articaine',
  'Mepivacaine',
  'Bupivacaine',
  'Chlorhexidine',
  'Fluoride',
  'Other...'
] as const;

export const ALLERGY_SEVERITIES = ['mild', 'moderate', 'severe'] as const;

export type AllergySeverity = typeof ALLERGY_SEVERITIES[number];
export type CommonAllergy = typeof COMMON_ALLERGIES[number];
export type CommonMedication = typeof COMMON_MEDICATIONS[number];