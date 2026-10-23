/** View Transitions hook for smooth tooth chart section navigation */

import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TransitionOptions {
  /** Custom class to add during transition */
  transitionClass?: string;
  /** Duration in ms for CSS fallback */
  fallbackDuration?: number;
  /** Easing for CSS fallback */
  fallbackEasing?: string;
}

/**
 * Hook to enable View Transitions API for route changes
 * Falls back to CSS animations if View Transitions not supported
 */
export function useViewTransitions(options: TransitionOptions = {}) {
  const navigate = useNavigate();
  const { transitionClass = 'view-transition', fallbackDuration = 300, fallbackEasing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' } = options;

  // Check if View Transitions API is supported
  const supportsViewTransitions = typeof document !== 'undefined' && 'startViewTransition' in document;

  // Navigate with View Transition
  const navigateWithTransition = useCallback(
    (to: string, opts?: { replace?: boolean; state?: unknown }) => {
      if (supportsViewTransitions) {
        (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(() => {
          navigate(to, opts);
        });
      } else {
        navigate(to, opts);
      }
    },
    [navigate, supportsViewTransitions]
  );

  // Replace with View Transition
  const replaceWithTransition = useCallback(
    (to: string, opts?: { state?: unknown }) => {
      if (supportsViewTransitions) {
        (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(() => {
          navigate(to, { replace: true, ...opts });
        });
      } else {
        navigate(to, { replace: true, ...opts });
      }
    },
    [navigate, supportsViewTransitions]
  );

  // Add transition classes to document for CSS fallback
  useEffect(() => {
    if (!supportsViewTransitions) {
      document.documentElement.classList.add(transitionClass);
      document.documentElement.style.setProperty('--transition-duration', `${fallbackDuration}ms`);
      document.documentElement.style.setProperty('--transition-easing', fallbackEasing);
    }

    return () => {
      document.documentElement.classList.remove(transitionClass);
    };
  }, [transitionClass, fallbackDuration, fallbackEasing, supportsViewTransitions]);

  return {
    navigate: navigateWithTransition,
    replace: replaceWithTransition,
    supportsViewTransitions,
  };
}

/**
 * Hook for section-specific transitions (overview ↔ section)
 * Provides enter/exit animation classes
 */
export function useSectionTransition() {
  const location = useLocation();
  const isSectionView = location.pathname.includes('/section/');
  const isOverviewView = location.pathname === '/tooth-chart';

  // Determine transition direction
  const transitionDirection = isSectionView ? 'enter' : isOverviewView ? 'exit' : 'idle';

  return {
    isSectionView,
    isOverviewView,
    transitionDirection,
    // CSS classes for animation
    containerClass: `tooth-chart-container transition-${transitionDirection}`,
    sectionClass: `tooth-section transition-${transitionDirection}`,
  };
}

/**
 * CSS-in-JS styles for View Transitions fallback
 * Inject these via a style tag or include in global CSS
 */
export const TRANSITION_STYLES = `
  /* View Transitions API polyfill styles */
  @media (prefers-reduced-motion: no-preference) {
    .tooth-chart-container {
      transition: opacity var(--transition-duration, 300ms) var(--transition-easing, cubic-bezier(0.25, 0.46, 0.45, 0.94)),
                  transform var(--transition-duration, 300ms) var(--transition-easing, cubic-bezier(0.25, 0.46, 0.45, 0.94));
    }

    .tooth-chart-container.transition-enter {
      opacity: 0;
      transform: scale(0.95) translateY(20px);
    }

    .tooth-chart-container.transition-enter-active {
      opacity: 1;
      transform: scale(1) translateY(0);
    }

    .tooth-chart-container.transition-exit {
      opacity: 1;
      transform: scale(1) translateY(0);
    }

    .tooth-chart-container.transition-exit-active {
      opacity: 0;
      transform: scale(0.95) translateY(-20px);
    }

    .tooth-section {
      transition: opacity var(--transition-duration, 300ms) var(--transition-easing, cubic-bezier(0.25, 0.46, 0.45, 0.94)),
                  transform var(--transition-duration, 300ms) var(--transition-easing, cubic-bezier(0.25, 0.46, 0.45, 0.94));
    }

    .tooth-section.transition-enter {
      opacity: 0;
      transform: translateX(30px);
    }

    .tooth-section.transition-enter-active {
      opacity: 1;
      transform: translateX(0);
    }

    .tooth-section.transition-exit {
      opacity: 1;
      transform: translateX(0);
    }

    .tooth-section.transition-exit-active {
      opacity: 0;
      transform: translateX(-30px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tooth-chart-container,
    .tooth-section {
      transition: none !important;
    }
  }
`;