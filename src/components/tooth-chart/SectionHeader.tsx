/** SectionHeader - Back navigation + section metadata for detail view */

import { useToothChart } from '../../context/ToothChartContext';
import { ArrowLeft, ChevronUp, ChevronDown, Square } from 'lucide-react';
import type { ToothSection } from '../../types/tooth-chart';

interface SectionHeaderProps {
  section: ToothSection;
  showArchToggle?: boolean;
  onArchToggle?: () => void;
}

export default function SectionHeader({ section, showArchToggle = false, onArchToggle }: SectionHeaderProps) {
  const { navigateToOverview } = useToothChart();

  const isUpper = section.arch === 'upper';

  return (
    <header className="mb-4 flex items-center justify-between gap-3">
      {/* Back button with View Transition */}
      <button
        type="button"
        onClick={(e) => {
          // Use View Transitions API for smooth zoom out
          if ('startViewTransition' in document) {
            e.preventDefault();
            (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(() => {
              navigateToOverview();
            });
          } else {
            navigateToOverview();
          }
        }}
        className="flex items-center gap-1.5 p-2 rounded-xl text-slate hover:bg-surface-container-low hover:text-ink transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="Back to overview"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        <span className="font-medium hidden sm:inline">Back</span>
      </button>

      {/* Section title */}
      <div className="flex-1 flex items-center justify-center gap-2 text-center">
        <span
          className={`p-2 rounded-xl ${isUpper ? 'bg-primary-soft text-primary' : 'bg-chart-soft text-chart-cat'}`}
          aria-hidden="true"
        >
          <Square className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-lg font-semibold truncate text-ink">{section.label}</h1>
          <p className="text-xs text-slate truncate">{section.description} · {section.teeth.length} teeth</p>
        </div>
      </div>

      {/* Arch toggle / spacer */}
      <div className="w-20 flex justify-end">
        {showArchToggle && onArchToggle && (
          <button
            type="button"
            onClick={onArchToggle}
            className="flex items-center gap-1 p-2 rounded-xl text-slate hover:bg-surface-container-low hover:text-ink transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={isUpper ? 'Switch to lower arch' : 'Switch to upper arch'}
          >
            {isUpper ? (
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}