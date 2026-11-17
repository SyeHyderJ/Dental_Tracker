/** ToothChartSection - Zoomed-in section detail view */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToothChart } from '../../context/ToothChartContext';
import SectionHeader from './SectionHeader';
import SectionToothGrid from './SectionToothGrid';
import ToothRecordForm from './ToothRecordForm';
import SectionHeroVisual from './SectionHeroVisual';
import type { SectionId, ToothSection } from '../../types/tooth-chart';
import { getSectionById, TOOTH_SECTIONS } from '../../types/tooth-chart';
import { ErrorBanner } from '../ui';

export default function ToothChartSection() {
  const { sectionId } = useParams<{ sectionId: SectionId }>();
  const {
    loading,
    error,
    currentSection,
    clearSelection,
    navigateToOverview,
    refreshRecords,
  } = useToothChart();

  const section = sectionId ? getSectionById(sectionId) : null;

  // Hero visual entrance animation state
  const [heroVisible, setHeroVisible] = useState(false);

  // Trigger entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Validate section exists
  if (!section) {
    return (
      <div className="surface-card p-6 text-center" role="alert">
        <h2 className="font-heading text-lg font-semibold text-destructive">Section not found</h2>
        <p className="mt-2 text-sm text-slate">The requested tooth chart section does not exist.</p>
        <button
          type="button"
          onClick={navigateToOverview}
          className="mt-4 btn-secondary"
        >
          Back to Overview
        </button>
      </div>
    );
  }

  // Clear selection when navigating away from this section
  useEffect(() => {
    return () => {
      if (currentSection === section.id) {
        clearSelection();
      }
    };
  }, [currentSection, section.id, clearSelection]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (currentSection === section.id) {
        navigateToOverview();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentSection, section.id, navigateToOverview]);

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading section">
        <div className="surface-card p-4 animate-pulse">
          <div className="h-6 w-1/4 bg-surface-container-low rounded" />
        </div>
        <div className="surface-card p-4 animate-pulse">
          <div className="h-8 w-full bg-surface-container-low rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-card p-6 text-center" role="alert">
        <ErrorBanner>{error}</ErrorBanner>
        <button type="button" onClick={refreshRecords} className="mt-4 btn-secondary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-section-id={section.id}>
      <SectionHeader section={section} />

      {/* Hero visual - anatomical illustration of section teeth */}
      <SectionHeroVisual
        section={section}
        transitionClass={heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      />

      <div className="surface-card p-4 space-y-5">
        <SectionToothGrid section={section} />
      </div>

      {/* Record form / detail panel */}
      <ToothRecordForm
        section={section}
        onClose={() => {
          clearSelection();
          // Don't navigate back, just clear selection
        }}
      />

      {/* Quick navigation to adjacent sections */}
      <SectionNavigator currentSection={section} />
    </div>
  );
}

/** Quick navigation between adjacent sections */
function SectionNavigator({ currentSection }: { currentSection: ToothSection }) {
  const { navigateToSection } = useToothChart();
  const currentIndex = TOOTH_SECTIONS.findIndex((s) => s.id === currentSection.id);
  const prevSection = TOOTH_SECTIONS[(currentIndex - 1 + TOOTH_SECTIONS.length) % TOOTH_SECTIONS.length];
  const nextSection = TOOTH_SECTIONS[(currentIndex + 1) % TOOTH_SECTIONS.length];

  return (
    <div className="flex items-center justify-between pt-2" role="navigation" aria-label="Section navigation">
      <button
        type="button"
        onClick={() => navigateToSection(prevSection.id)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate hover:bg-surface-container-low hover:text-ink transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`Previous: ${prevSection.label}`}
      >
        <span className="text-lg">←</span>
        <span className="hidden sm:inline">{prevSection.shortLabel}</span>
      </button>

      <div className="flex items-center gap-1 text-xs text-slate">
        {TOOTH_SECTIONS.map((s, i) => (
          <span
            key={s.id}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIndex
                ? (s.arch === 'upper' ? 'bg-primary' : 'bg-chart-cat')
                : 'bg-border'
            }`}
            aria-current={i === currentIndex ? 'step' : undefined}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigateToSection(nextSection.id)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate hover:bg-surface-container-low hover:text-ink transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`Next: ${nextSection.label}`}
      >
        <span className="hidden sm:inline">{nextSection.shortLabel}</span>
        <span className="text-lg">→</span>
      </button>
    </div>
  );
}