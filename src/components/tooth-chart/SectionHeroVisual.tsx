/** SectionHeroVisual - Large anatomical illustration for section detail view */

import type { ToothSection } from '../../types/tooth-chart';
import { getToothType, getToothTypeColor, getToothTypeLabel } from '../../lib/tooth-utils';

interface SectionHeroVisualProps {
  section: ToothSection;
  /** Animation class for entrance transition */
  transitionClass?: string;
}

export default function SectionHeroVisual({ section, transitionClass = '' }: SectionHeroVisualProps) {
  const isUpper = section.arch === 'upper';
  const teeth = section.teeth;

  // Build tooth data with type information
  const toothData = teeth.map((toothNumber) => ({
    number: toothNumber,
    type: getToothType(toothNumber),
    typeLabel: getToothTypeLabel(getToothType(toothNumber)),
    typeColor: getToothTypeColor(getToothType(toothNumber)),
  }));

  // For anterior sections, we want to show teeth in anatomical order (left to right)
  // Upper Anterior: 6-11 (right to left anatomically)
  // Lower Anterior: 22-27 (left to right anatomically)
  // For posterior sections, show in universal numbering order
  const displayTeeth = (section.id === 'upper-anterior' || section.id === 'lower-anterior')
    ? [...toothData].reverse() // Reverse for anatomical left-to-right view
    : toothData;

  return (
    <div
      className={`surface-card p-4 sm:p-6 rounded-2xl overflow-hidden transition-all duration-500 ${transitionClass}`}
      data-section-id={section.id}
      role="img"
      aria-label={`Anatomical illustration of ${section.label} teeth: ${teeth.map(t => `Tooth ${t}`).join(', ')}`}
    >
      {/* Section title and arch indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl ${isUpper ? 'bg-primary-soft' : 'bg-chart-soft'}`}
            aria-hidden="true"
          >
            <ArchIcon arch={section.arch} className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink">{section.label}</h2>
            <p className="text-sm text-slate">{section.description}</p>
          </div>
        </div>
        <span className="text-lg font-mono font-semibold text-slate/40">{section.shortLabel}</span>
      </div>

      {/* Hero tooth illustrations */}
      <div className="relative">
        {/* Tooth row */}
        <div className="flex items-end justify-center gap-2 sm:gap-3 pb-8" role="list" aria-label="Tooth illustrations">
          {displayTeeth.map((tooth, index) => (
            <ToothIllustration
              key={tooth.number}
              tooth={tooth}
              index={index}
              isUpper={isUpper}
              total={displayTeeth.length}
            />
          ))}
        </div>

        {/* Tooth type labels below */}
        <div className="flex justify-center gap-2 sm:gap-3 pt-2" role="list" aria-label="Tooth type labels">
          {displayTeeth.map((tooth) => (
            <div
              key={tooth.number}
              className="flex flex-col items-center gap-1 text-center min-w-[50px]"
              role="listitem"
            >
              <span className={`text-xs font-medium ${tooth.typeColor}`}>
                {tooth.typeLabel}
              </span>
              <span className="text-[10px] font-mono text-slate/50">#{tooth.number}</span>
            </div>
          ))}
        </div>

        {/* Arch curve indicator */}
        <ArchCurve isUpper={isUpper} toothCount={teeth.length} />
      </div>

      {/* Tooth type legend for this section */}
      <SectionToothTypeLegend toothData={toothData} />
    </div>
  );
}

/** Individual tooth anatomical illustration */
function ToothIllustration({
  tooth,
  index,
  isUpper,
  total,
}: {
  tooth: { number: number; type: string; typeColor: string; typeLabel: string };
  index: number;
  isUpper: boolean;
  total: number;
}) {
  // Size based on tooth type
  const sizeMap = {
    molar: { width: 56, height: 56 },
    premolar: { width: 48, height: 52 },
    canine: { width: 44, height: 56 },
    incisor: { width: 40, height: 56 },
  };

  const { width, height } = sizeMap[tooth.type as keyof typeof sizeMap] || { width: 48, height: 52 };
  const scale = total > 5 ? 0.85 : 1; // Slightly smaller for anterior sections (6 teeth)

  return (
    <div
      className="flex flex-col items-center"
      style={{ transform: `scale(${scale})` }}
      role="listitem"
      aria-label={`Tooth ${tooth.number}: ${tooth.typeLabel}`}
    >
      <div className="relative" style={{ width, height }}>
        {/* Tooth SVG */}
        <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
          <ToothShape type={tooth.type} isUpper={isUpper} isRightSide={index < total / 2} />
        </svg>

        {/* Tooth number badge */}
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink/80 text-on-background text-[10px] font-mono font-bold flex items-center justify-center">
          {tooth.number}
        </div>

        {/* Type color accent bar */}
        <div
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-t transition-opacity`}
          style={{ backgroundColor: `var(--color-${tooth.typeColor.replace('text-', '').replace('dark:text-', '')})` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/** SVG tooth shapes - anatomically accurate representations */
function ToothShape({
  type,
  isUpper,
  isRightSide,
}: {
  type: string;
  isUpper: boolean;
  isRightSide: boolean;
}) {
  const strokeColor = 'currentColor';
  const strokeWidth = 2;
  const fillColor = 'transparent';

  // Flip horizontally for left side teeth
  const transform = isRightSide ? '' : 'scale(-1, 1) translate(-64, 0)';

  switch (type) {
    case 'molar': {
      // Upper molar: 4 cusps, rhomboid shape
      // Lower molar: 5 cusps, more rectangular
      if (isUpper) {
        return (
          <g transform={transform || undefined}>
            {/* Crown outline - rhomboid with 4 cusps */}
            <path
              d="M12 8 L28 4 L52 16 L36 32 L12 28 Z
                 M20 14 L24 10 L36 18 L32 22 Z
                 M32 18 L36 10 L48 18 L44 26 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Roots - 3 roots for upper molars */}
            <path d="M18 32 L16 52" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
            <path d="M32 32 L32 52" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
            <path d="M46 32 L48 52" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
            {/* Fissure lines */}
            <path d="M20 14 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
            <path d="M44 18 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
          </g>
        );
      }
      // Lower molar - 5 cusps, rectangular
      return (
        <g transform={transform || undefined}>
          <path
            d="M10 8 L54 8 L54 32 L10 32 Z
               M18 14 L22 8 L30 16 L26 20 Z
               M34 8 L42 14 L38 20 L30 16 Z
               M46 14 L50 8 L54 16 L50 20 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          {/* Roots - 2 roots for lower molars */}
          <path d="M20 32 L18 52" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
          <path d="M44 32 L46 52" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
          {/* Fissure lines */}
          <path d="M32 8 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
          <path d="M18 14 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
          <path d="M46 14 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
        </g>
      );
    }

    case 'premolar': {
      // Upper premolar: 2 cusps (buccal larger), oval
      // Lower premolar: 2-3 cusps, more circular
      if (isUpper) {
        return (
          <g transform={transform || undefined}>
            <path
              d="M16 8 L48 8 C50 8 52 12 52 18 L52 32 C52 40 50 44 46 46 L18 46 C14 44 12 40 12 32 L12 18 C12 12 14 8 16 8 Z
                 M28 12 L36 8 L42 20 L34 26 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Root - single root for upper premolars (usually) */}
            <path d="M32 32 L32 52" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
            {/* Fissure */}
            <path d="M32 12 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
          </g>
        );
      }
      // Lower premolar
      return (
        <g transform={transform || undefined}>
          <path
            d="M18 8 L46 8 C48 8 50 12 50 18 L50 32 C50 38 48 42 44 44 L20 44 C16 42 14 38 14 32 L14 18 C14 12 16 8 18 8 Z
               M26 10 L32 8 L38 10 L38 28 L26 28 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <path d="M32 32 L32 52" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
          <path d="M32 10 L32 28" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
        </g>
      );
    }

    case 'canine': {
      // Single pointed cusp, long root
      return (
        <g transform={transform || undefined}>
          <path
            d="M20 8 L44 8 C48 8 50 12 50 18 L50 30 C50 36 48 40 44 42 L32 48 L20 42 C14 40 12 36 12 30 L12 18 C12 12 14 8 16 8 Z
               M28 10 L32 8 L36 10 L36 28 L28 28 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          {/* Long single root */}
          <path d="M32 32 L32 58" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" />
          {/* Cusp ridge */}
          <path d="M32 10 L32 28" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
        </g>
      );
    }

    case 'incisor': {
      // Chisel-shaped, flat incisal edge
      return (
        <g transform={transform || undefined}>
          <path
            d="M22 8 L42 8 L42 30 C42 36 38 40 32 42 C26 40 22 36 22 30 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          {/* Single root */}
          <path d="M32 32 L32 56" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
          {/* Incisal edge indicator */}
          <path d="M22 8 L42 8" stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          {/* Mamelons (developmental lobes) - subtle */}
          <path d="M28 8 L28 16" stroke={strokeColor} strokeWidth={1} strokeDasharray="2 2" opacity="0.3" />
          <path d="M32 8 L32 16" stroke={strokeColor} strokeWidth={1} strokeDasharray="2 2" opacity="0.3" />
          <path d="M36 8 L36 16" stroke={strokeColor} strokeWidth={1} strokeDasharray="2 2" opacity="0.3" />
        </g>
      );
    }

    default:
      return null;
  }
}

/** Arch curve indicator showing upper/lower jaw shape */
function ArchCurve({ isUpper, toothCount }: { isUpper: boolean; toothCount: number }) {
  // Width scales with tooth count
  const width = toothCount <= 5 ? 280 : 340;

  return (
    <svg
      className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
      viewBox={`0 0 ${width} 24`}
      width={width}
      height={24}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="archGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {isUpper ? (
        // Upper arch: curve downward (like roof of mouth)
        <path
          d={`M0,20 Q${width / 2},4 ${width},20`}
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 4"
          fill="url(#archGradient)"
          opacity="0.6"
        />
      ) : (
        // Lower arch: curve upward (like jaw)
        <path
          d={`M0,4 Q${width / 2},20 ${width},4`}
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 4"
          fill="url(#archGradient)"
          opacity="0.6"
        />
      )}
    </svg>
  );
}

/** Legend showing tooth types present in this section */
function SectionToothTypeLegend({
  toothData,
}: {
  toothData: Array<{ number: number; type: string; typeLabel: string; typeColor: string }>;
}) {
  // Get unique tooth types in this section
  const uniqueTypes = [...new Set(toothData.map((t) => t.type))];

  const typeOrder = ['molar', 'premolar', 'canine', 'incisor'];
  const sortedTypes = uniqueTypes.sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));

  if (sortedTypes.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border" role="region" aria-label="Tooth types in this section">
      <p className="text-xs font-medium text-slate mb-2">Tooth types in this section:</p>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {sortedTypes.map((type) => {
          const count = toothData.filter((t) => t.type === type).length;
          const label = getToothTypeLabel(type as any);
          const color = getToothTypeColor(type as any);
          return (
            <span
              key={type}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-surface-container-low text-xs"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: `var(--color-${color.replace('text-', '').replace('dark:text-', '')})`,
                }}
                aria-hidden="true"
              />
              <span className={`font-medium ${color}`}>
                {label}{count > 1 ? ` (${count})` : ''}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Arch icon for section header */
function ArchIcon({ arch, className }: { arch: 'upper' | 'lower'; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      {arch === 'upper' ? (
        // Upper arch - maxillary
        <path d="M4 16 Q12 8 20 16 M6 16 Q12 12 18 16" strokeLinecap="round" />
      ) : (
        // Lower arch - mandibular
        <path d="M4 8 Q12 16 20 8 M6 8 Q12 12 18 8" strokeLinecap="round" />
      )}
    </svg>
  );
}