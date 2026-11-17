/** Shared tooth chart utilities - extracted from ToothChart.tsx */

import type { ToothRecord, ToothCondition } from '../types/tooth-chart';

/**
 * Get the most recent condition for a tooth, or 'healthy' if none
 */
export function getToothCondition(
  records: ToothRecord[],
  toothNumber: number
): ToothCondition {
  const toothRecords = records
    .filter((r) => r.tooth_number === toothNumber)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (toothRecords.length === 0) {
    return 'healthy';
  }
  return toothRecords[0].condition as ToothCondition;
}

/**
 * Get Tailwind background class for a tooth based on condition
 */
export function getToothBackgroundClass(condition: ToothCondition): string {
  const c = condition.toLowerCase();
  if (c === 'healthy') return 'bg-healthy-soft text-healthy';
  if (c === 'filling') return 'bg-filling-soft text-filling';
  if (c === 'crown') return 'bg-crown-soft text-crown';
  if (c === 'cavity' || c === 'extracted' || c === 'needs-attention')
    return 'bg-warning-soft text-warning';
  return 'bg-surface-container-low text-ink';
}

/**
 * Determine if a dot indicator should show for a condition
 */
export function shouldShowDot(condition: ToothCondition): boolean {
  const c = condition.toLowerCase();
  return c === 'cavity' || c === 'needs-attention' || c === 'extracted';
}

/**
 * Get all records for a specific tooth, sorted by date descending
 */
export function getToothRecords(
  records: ToothRecord[],
  toothNumber: number
): ToothRecord[] {
  return records
    .filter((r) => r.tooth_number === toothNumber)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get condition display label with proper capitalization
 */
export function getConditionLabel(condition: ToothCondition): string {
  const labels: Record<ToothCondition, string> = {
    healthy: 'Healthy',
    filling: 'Filling',
    crown: 'Crown',
    cavity: 'Cavity',
    extracted: 'Extracted',
    'needs-attention': 'Needs attention',
  };
  return labels[condition] ?? condition;
}

/**
 * Format date for display
 */
export function formatRecordDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

/**
 * Get tooth type by universal number (1-32)
 * Returns: 'molar', 'premolar', 'canine', or 'incisor'
 */
export function getToothType(toothNumber: number): 'molar' | 'premolar' | 'canine' | 'incisor' {
  // Upper arch (1-16)
  if (toothNumber >= 1 && toothNumber <= 16) {
    if (toothNumber <= 5) {
      // Upper Right: 1,2 = Molars; 3,4 = Premolars; 5 = Canine
      if (toothNumber <= 2) return 'molar';
      if (toothNumber <= 4) return 'premolar';
      return 'canine';
    }
    if (toothNumber <= 11) {
      // Upper Anterior: 6 = Canine; 7,8,9,10 = Incisors; 11 = Canine
      if (toothNumber === 6 || toothNumber === 11) return 'canine';
      return 'incisor';
    }
    // Upper Left: 12 = Canine; 13,14 = Premolars; 15,16 = Molars
    if (toothNumber === 12) return 'canine';
    if (toothNumber <= 14) return 'premolar';
    return 'molar';
  }

  // Lower arch (17-32)
  if (toothNumber <= 21) {
    // Lower Left: 17,18 = Molars; 19,20 = Premolars; 21 = Canine
    if (toothNumber <= 18) return 'molar';
    if (toothNumber <= 20) return 'premolar';
    return 'canine';
  }
  if (toothNumber <= 27) {
    // Lower Anterior: 22 = Canine; 23,24,25,26 = Incisors; 27 = Canine
    if (toothNumber === 22 || toothNumber === 27) return 'canine';
    return 'incisor';
  }
  // Lower Right: 28 = Canine; 29,30 = Premolars; 31,32 = Molars
  if (toothNumber === 28) return 'canine';
  if (toothNumber <= 30) return 'premolar';
  return 'molar';
}

/**
 * Get color class for tooth type (for visual coding)
 */
export function getToothTypeColor(type: 'molar' | 'premolar' | 'canine' | 'incisor'): string {
  switch (type) {
    case 'molar':
      return 'text-blue-600 dark:text-blue-400';
    case 'premolar':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'canine':
      return 'text-orange-600 dark:text-orange-400';
    case 'incisor':
      return 'text-violet-600 dark:text-violet-400';
  }
}

/**
 * Get tooth type label for display
 */
export function getToothTypeLabel(type: 'molar' | 'premolar' | 'canine' | 'incisor'): string {
  switch (type) {
    case 'molar':
      return 'Molar';
    case 'premolar':
      return 'Premolar';
    case 'canine':
      return 'Canine';
    case 'incisor':
      return 'Incisor';
  }
}