import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect virtual keyboard height using the Visual Viewport API
 * Returns the keyboard height offset (0 when keyboard is closed)
 * Only applies when an input/textarea/select is focused
 */
export function useVisualViewport(): number {
  const [offset, setOffset] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsInputFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsInputFocused(false);
    setOffset(0);
  }, []);

  useEffect(() => {
    if (!window.visualViewport) {
      // Visual Viewport API not supported (e.g., older browsers)
      return;
    }

    const viewport = window.visualViewport;

    const handleResize = () => {
      if (!isInputFocused) {
        setOffset(0);
        return;
      }

      // Calculate keyboard height: difference between layout viewport and visual viewport
      // layout viewport = window.innerHeight (includes keyboard when open on some browsers)
      // visual viewport = viewport.height (excludes keyboard)
      const keyboardHeight = window.innerHeight - viewport.height;

      // Only apply positive offset (keyboard open)
      // Clamp to reasonable max (e.g., 50% of screen height)
      const maxOffset = window.innerHeight * 0.5;
      setOffset(Math.max(0, Math.min(keyboardHeight, maxOffset)));
    };

    const handleScroll = () => {
      // Also handle scroll events which can affect viewport
      handleResize();
    };

    // Initial measurement
    handleResize();

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleScroll);

    // Listen for focus/blur on all form elements
    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleScroll);
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
    };
  }, [isInputFocused, handleFocus, handleBlur]);

  return offset;
}

/**
 * Hook that provides both the keyboard offset and a ref setter
 * to manually track focus state for specific elements
 */
export function useVisualViewportWithRef() {
  const [offset, setOffset] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!window.visualViewport) return;

    const viewport = window.visualViewport;

    const handleResize = () => {
      if (!isFocused) {
        setOffset(0);
        return;
      }
      const keyboardHeight = window.innerHeight - viewport.height;
      const maxOffset = window.innerHeight * 0.5;
      setOffset(Math.max(0, Math.min(keyboardHeight, maxOffset)));
    };

    handleResize();
    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, [isFocused]);

  return { offset, setIsFocused };
}