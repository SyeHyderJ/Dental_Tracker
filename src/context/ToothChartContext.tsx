/** ToothChart Context - Shared state for tooth chart overview and section views */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { ToothRecord, ToothCondition, SectionId, ToothSection } from '../types/tooth-chart';
import { TOOTH_SECTIONS, getSectionById } from '../types/tooth-chart';
import { getToothCondition, getToothRecords } from '../lib/tooth-utils';

interface ToothChartContextValue {
  // Data
  records: ToothRecord[];
  loading: boolean;
  error: string | null;

  // Selection state
  selectedTooth: number | null;
  currentSection: SectionId | null;

  // Actions
  selectTooth: (toothNumber: number) => void;
  clearSelection: () => void;
  navigateToSection: (sectionId: SectionId) => void;
  navigateToOverview: () => void;
  refreshRecords: () => Promise<void>;

  // Computed
  getToothCondition: (toothNumber: number) => ToothCondition;
  getToothRecords: (toothNumber: number) => ToothRecord[];
  getSection: (sectionId: SectionId) => ToothSection;
  getAllSections: () => readonly ToothSection[];
}

const ToothChartContext = createContext<ToothChartContextValue | null>(null);

export function ToothChartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ sectionId: SectionId }>();

  const [records, setRecords] = useState<ToothRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [currentSection, setCurrentSection] = useState<SectionId | null>(params.sectionId ?? null);

  // Fetch all records once on mount/user change
  const fetchRecords = useCallback(async () => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('tooth_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setRecords(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Sync currentSection with URL params
  useEffect(() => {
    if (params.sectionId) {
      setCurrentSection(params.sectionId);
    }
  }, [params.sectionId]);

  const selectTooth = useCallback((toothNumber: number) => {
    setSelectedTooth(toothNumber);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTooth(null);
  }, []);

  const navigateToSection = useCallback((sectionId: SectionId) => {
    setCurrentSection(sectionId);
    navigate(`/tooth-chart/section/${sectionId}`);
  }, [navigate]);

  const navigateToOverview = useCallback(() => {
    setCurrentSection(null);
    setSelectedTooth(null);
    navigate('/tooth-chart');
  }, [navigate]);

  const refreshRecords = useCallback(async () => {
    await fetchRecords();
  }, [fetchRecords]);

  // Memoized helpers
  const getToothConditionFn = useCallback(
    (toothNumber: number): ToothCondition => getToothCondition(records, toothNumber),
    [records]
  );

  const getToothRecordsFn = useCallback(
    (toothNumber: number): ToothRecord[] => getToothRecords(records, toothNumber),
    [records]
  );

  const getSectionFn = useCallback((sectionId: SectionId): ToothSection => getSectionById(sectionId), []);

  const getAllSectionsFn = useCallback((): readonly ToothSection[] => TOOTH_SECTIONS, []);

  const value: ToothChartContextValue = {
    records,
    loading,
    error,
    selectedTooth,
    currentSection,
    selectTooth,
    clearSelection,
    navigateToSection,
    navigateToOverview,
    refreshRecords,
    getToothCondition: getToothConditionFn,
    getToothRecords: getToothRecordsFn,
    getSection: getSectionFn,
    getAllSections: getAllSectionsFn,
  };

  return <ToothChartContext.Provider value={value}>{children}</ToothChartContext.Provider>;
}

export function useToothChart(): ToothChartContextValue {
  const context = useContext(ToothChartContext);
  if (!context) {
    throw new Error('useToothChart must be used within a ToothChartProvider');
  }
  return context;
}