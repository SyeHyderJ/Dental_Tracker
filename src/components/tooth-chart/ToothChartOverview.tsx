/** ToothChartOverview - Main view with 6 clickable section cards */

import { useToothChart } from '../../context/ToothChartContext';
import { getToothBackgroundClass, shouldShowDot } from '../../lib/tooth-utils';
import type { ToothSection, SectionId, ToothCondition } from '../../types/tooth-chart';
import { Circle, Square, Triangle } from 'lucide-react';

interface SectionCardProps {
  section: ToothSection;
  onClick: (id: SectionId) => void;
}

function SectionCard({ section, onClick }: SectionCardProps) {
  const { getToothCondition } = useToothChart();

  // Count conditions in this section
  const conditionCounts = section.teeth.reduce(
    (acc, tooth) => {
      const condition = getToothCondition(tooth);
      acc[condition] = (acc[condition] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const hasIssues =
    (conditionCounts.cavity ?? 0) +
    (conditionCounts.extracted ?? 0) +
    (conditionCounts['needs-attention'] ?? 0) > 0;

  const issueCount =
    (conditionCounts.cavity ?? 0) +
    (conditionCounts.extracted ?? 0) +
    (conditionCounts['needs-attention'] ?? 0);

  // Icon based on section type
  const SectionIcon = section.icon === 'molar' ? Square : section.icon === 'incisor' ? Triangle : Circle;

  return (
    <button
      type="button"
      onClick={() => onClick(section.id)}
      className={`relative group surface-card p-4 transition-all duration-300
        hover:shadow-lg hover:-translate-y-1
        active:scale-[0.98] active:translate-y-0
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${hasIssues ? 'ring-1 ring-warning' : ''}`}
      aria-label={`View ${section.label} section - ${section.teeth.length} teeth${issueCount > 0 ? `, ${issueCount} needing attention` : ''}`}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`p-2 rounded-xl ${section.arch === 'upper' ? 'bg-primary-soft text-primary' : 'bg-chart-soft text-chart-cat'}`}
          >
            <SectionIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-heading font-semibold text-ink">{section.label}</h3>
            <p className="text-xs text-slate">{section.description}</p>
          </div>
        </div>
        <span className="text-2xl font-mono font-semibold text-slate/50 group-hover:text-slate/70 transition-colors">
          {section.shortLabel}
        </span>
      </div>

      {/* Mini tooth preview - simplified shapes */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-3" role="img" aria-label={`${section.teeth.length} teeth in this section`}>
        {section.teeth.map((toothNumber, index) => {
          const condition = getToothCondition(toothNumber);
          return (
            <div
              key={toothNumber}
              className={`relative transition-all duration-200 group-hover:scale-110
                ${getToothBackgroundClass(condition)}`}
              style={{
                zIndex: section.teeth.length - index,
                width: 'clamp(28px, 6vw, 36px)',
                height: 'clamp(36px, 8vw, 44px)',
              }}
            >
              {shouldShowDot(condition) && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-warning" />
              )}
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-ink/50">
                {toothNumber}
              </span>
            </div>
          );
        })}
      </div>

      {/* Condition summary badges */}
      <div className="flex flex-wrap gap-1.5" role="status" aria-live="polite">
        {(Object.entries(conditionCounts) as [ToothCondition, number][]).map(([condition, count]) => (
          <span
            key={condition}
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getToothBackgroundClass(condition)}`}
          >
            {count} {condition === 'needs-attention' ? 'Need care' : condition}
          </span>
        ))}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="px-2 py-1 bg-ink/80 text-on-background text-xs rounded-full">
          Zoom in
        </span>
      </div>
    </button>
  );
}

export default function ToothChartOverview() {
  const { getAllSections, navigateToSection, loading } = useToothChart();

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading tooth chart sections">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="surface-card p-4 animate-pulse">
            <div className="h-6 w-3/12 bg-surface-container-low rounded" />
            <div className="mt-3 h-12 w-full bg-surface-container-low rounded" />
            <div className="mt-3 flex gap-2">
              <div className="h-5 w-20 bg-surface-container-low rounded-full" />
              <div className="h-5 w-20 bg-surface-container-low rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sections = getAllSections();
  const upperSections = sections.filter((s) => s.arch === 'upper');
  const lowerSections = sections.filter((s) => s.arch === 'lower');

  return (
    <div className="space-y-6" role="region" aria-label="Dental chart sections">
      {/* Upper arch sections */}
      <section aria-labelledby="upper-heading">
        <h2 id="upper-heading" className="text-center text-xs font-medium text-slate mb-4">
          Upper Arch
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {upperSections.map((section) => (
            <SectionCard key={section.id} section={section} onClick={navigateToSection} />
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="relative my-2 sm:my-4">
        <div className="h-px bg-border" />
        <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-2 bg-porcelain text-xs text-slate">
          Lower Arch
        </span>
      </div>

      {/* Lower arch sections */}
      <section aria-labelledby="lower-heading">
        <h2 id="lower-heading" className="sr-only">Lower Arch</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {lowerSections.map((section) => (
            <SectionCard key={section.id} section={section} onClick={navigateToSection} />
          ))}
        </div>
      </section>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 pt-2 text-xs text-slate border-t border-border">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-healthy" aria-hidden="true" />
          Healthy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-filling" aria-hidden="true" />
          Filling
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-crown" aria-hidden="true" />
          Crown
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-warning" aria-hidden="true" />
          Needs care
        </span>
      </div>
    </div>
  );
}