/** ToothChart - Main tooth chart screen with overview and section views */

import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { ToothChartProvider } from '../context/ToothChartContext';
import ToothChartOverview from '../components/tooth-chart/ToothChartOverview';
import ToothChartSection from '../components/tooth-chart/ToothChartSection';
import AppShell from '../components/AppShell';
import { ErrorBanner, Spinner } from '../components/ui';
import { useToothChart } from '../context/ToothChartContext';

/** Inner component that renders the appropriate view based on route */
function ToothChartInner() {
  const location = useLocation();
  const { loading, error } = useToothChart();
  const isSectionView = location.pathname.includes('/section/');

  if (loading) {
    return (
      <AppShell title="Dental chart" subtitle="Loading..." active="chart">
        <Spinner />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Dental chart" subtitle="Error" active="chart">
        <ErrorBanner>{error}</ErrorBanner>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dental chart" subtitle={isSectionView ? 'Section detail' : 'Overview'} active="chart">
      <main className="tooth-chart-container" data-view={isSectionView ? 'section' : 'overview'}>
        <Outlet />
      </main>
    </AppShell>
  );
}

/** Main export - sets up nested routes with provider */
export default function ToothChart() {
  return (
    <ToothChartProvider>
      <Routes>
        <Route element={<ToothChartInner />}>
          {/* Overview route */}
          <Route index element={<ToothChartOverview />} />

          {/* Section detail route */}
          <Route path="section/:sectionId" element={<ToothChartSection />} />
        </Route>
      </Routes>
    </ToothChartProvider>
  );
}