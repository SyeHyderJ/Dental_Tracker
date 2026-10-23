/** Tooth Chart Section Types - Anatomically organized sections for zoom navigation */

export type SectionId =
  | 'upper-right'
  | 'upper-anterior'
  | 'upper-left'
  | 'lower-left'
  | 'lower-anterior'
  | 'lower-right';

export type ArchType = 'upper' | 'lower';

export interface ToothSection {
  id: SectionId;
  label: string;
  shortLabel: string;
  arch: ArchType;
  teeth: number[]; // Universal numbering 1-32
  icon: 'molar' | 'incisor' | 'canine'; // For visual identification
  description: string;
}

// Universal numbering: 1-16 upper, 17-32 lower
// Upper right: 1-8 (molars → central), Upper left: 9-16 (central → molars)
// Lower left: 17-24 (molars → central), Lower right: 25-32 (central → molars)

export const TOOTH_SECTIONS: readonly ToothSection[] = [
  {
    id: 'upper-right',
    label: 'Upper Right',
    shortLabel: 'UR',
    arch: 'upper',
    teeth: [1, 2, 3, 4, 5], // 2 molars, 2 premolars, 1 canine
    icon: 'molar',
    description: 'Molars & premolars',
  },
  {
    id: 'upper-anterior',
    label: 'Upper Anterior',
    shortLabel: 'UA',
    arch: 'upper',
    teeth: [6, 7, 8, 9, 10, 11], // 1 canine, 4 incisors, 1 canine
    icon: 'incisor',
    description: 'Canines & incisors',
  },
  {
    id: 'upper-left',
    label: 'Upper Left',
    shortLabel: 'UL',
    arch: 'upper',
    teeth: [12, 13, 14, 15, 16], // 1 canine, 2 premolars, 2 molars
    icon: 'molar',
    description: 'Premolars & molars',
  },
  {
    id: 'lower-left',
    label: 'Lower Left',
    shortLabel: 'LL',
    arch: 'lower',
    teeth: [17, 18, 19, 20, 21], // 2 molars, 2 premolars, 1 canine
    icon: 'molar',
    description: 'Molars & premolars',
  },
  {
    id: 'lower-anterior',
    label: 'Lower Anterior',
    shortLabel: 'LA',
    arch: 'lower',
    teeth: [22, 23, 24, 25, 26, 27], // 1 canine, 4 incisors, 1 canine
    icon: 'incisor',
    description: 'Canines & incisors',
  },
  {
    id: 'lower-right',
    label: 'Lower Right',
    shortLabel: 'LR',
    arch: 'lower',
    teeth: [28, 29, 30, 31, 32], // 1 canine, 2 premolars, 2 molars
    icon: 'molar',
    description: 'Premolars & molars',
  },
] as const;

export const SECTION_BY_ID: Record<SectionId, ToothSection> = Object.fromEntries(
  TOOTH_SECTIONS.map((s) => [s.id, s])
) as Record<SectionId, ToothSection>;

export function getSectionForTooth(toothNumber: number): ToothSection | undefined {
  return TOOTH_SECTIONS.find((s) => s.teeth.includes(toothNumber));
}

export function getSectionById(id: SectionId): ToothSection {
  return SECTION_BY_ID[id];
}

export function getAllTeethInOrder(): number[] {
  return TOOTH_SECTIONS.flatMap((s) => s.teeth);
}

export type ToothCondition =
  | 'healthy'
  | 'filling'
  | 'crown'
  | 'cavity'
  | 'extracted'
  | 'needs-attention';

export interface ToothRecord {
  id: string;
  user_id: string;
  tooth_number: number;
  condition: ToothCondition;
  notes: string | null;
  date: string;
  created_at?: string;
  provider_name: string | null;
}