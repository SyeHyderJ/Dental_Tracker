/** SectionToothGrid - Detailed tooth grid for a single section */

import { useToothChart } from '../../context/ToothChartContext';
import { getToothBackgroundClass, shouldShowDot, getConditionLabel } from '../../lib/tooth-utils';
import type { ToothSection, ToothCondition } from '../../types/tooth-chart';

interface SectionToothGridProps {
  section: ToothSection;
}

export default function SectionToothGrid({ section }: SectionToothGridProps) {
  const { selectedTooth, selectTooth, getToothCondition, getToothRecords } = useToothChart();

  const teeth = section.teeth;

  return (
    <div className="space-y-4" role="region" aria-label={`${section.label} teeth`}>
      {/* Tooth grid - anatomically arranged */}
      <div className="grid grid-cols-3 gap-2" role="list" aria-label={`${section.label} - ${teeth.length} teeth`}>
        {teeth.map((toothNumber, index) => {
          const condition = getToothCondition(toothNumber);
          const isSelected = selectedTooth === toothNumber;
          const records = getToothRecords(toothNumber);
          const hasRecords = records.length > 0;

          return (
            <button
              key={toothNumber}
              type="button"
              onClick={() => selectTooth(toothNumber)}
              className={`relative aspect-square min-h-[60px] rounded-xl font-mono text-sm
                ${getToothBackgroundClass(condition)}
                ${isSelected ? 'ring-3 ring-primary ring-offset-2 ring-offset-card' : ''}
                transition-all duration-200
                hover:shadow-md hover:scale-[1.02]
                active:scale-[0.98]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
              aria-label={`Tooth ${toothNumber}: ${getConditionLabel(condition)}${hasRecords ? `, ${records.length} record${records.length > 1 ? 's' : ''}` : ''}`}
              aria-selected={isSelected}
              role="listitem"
            >
              {/* Tooth number */}
              <span className="absolute top-1.5 left-1.5 text-xs font-semibold text-ink/70">
                {toothNumber}
              </span>

              {/* Condition indicator dot */}
              {shouldShowDot(condition) && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-warning" aria-hidden="true" />
              )}

              {/* Tooth shape hint - simplified anatomical hint */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <ToothShape
                  section={section}
                  index={index}
                  condition={condition}
                />
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-xs font-semibold text-primary">
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section-specific legend */}
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

/** Simplified tooth shape component for visual differentiation */
function ToothShape({
  section,
  index,
  condition,
}: {
  section: ToothSection;
  index: number;
  condition: ToothCondition;
}) {
  const isUpper = section.arch === 'upper';
  const isAnterior = section.icon === 'incisor';

  // Determine tooth type from position
  const totalTeeth = section.teeth.length;
  const isMolar = !isAnterior && (index < 2 || index >= totalTeeth - 2);
  const isPremolar = !isAnterior && !isMolar;
  const isCanine = isAnterior && (index === 0 || index === totalTeeth - 1);
  const isIncisor = isAnterior && !isCanine;

  const baseColor = condition === 'healthy' ? 'text-healthy/30' : 'text-ink/20';

  if (isMolar) {
    // Molar: larger, more square with 4 cusp hints
    return (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" className={baseColor} strokeWidth="1.5" />
        <path d="M12 3v18M3 12h18" className={baseColor} strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    );
  }

  if (isPremolar) {
    // Premolar: slightly smaller, 2 cusp hints
    return (
      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 4 C12 4 18 4 18 10 C18 16 12 20 12 20 C12 20 6 16 6 10 C6 4 12 4 12 4 Z"
          className={baseColor}
          strokeWidth="1.5"
        />
        <line x1="12" y1="4" x2="12" y2="20" className={baseColor} strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    );
  }

  if (isCanine) {
    // Canine: pointed, single cusp
    return (
      <svg className="w-8 h-10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3 L19 18 C19 18 18 21 12 21 C6 21 5 18 5 18 L12 3 Z"
          className={baseColor}
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (isIncisor) {
    // Incisor: flat, chisel-shaped
    return (
      <svg className="w-7 h-10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M8 3 L16 3 L16 21 L8 21 Z"
          className={baseColor}
          strokeWidth="1.5"
        />
        {isUpper ? (
          <path d="M12 3v6" className={baseColor} strokeWidth="1" strokeDasharray="2 2" />
        ) : (
          <path d="M12 21v-6" className={baseColor} strokeWidth="1" strokeDasharray="2 2" />
        )}
      </svg>
    );
  }

  return null;
}