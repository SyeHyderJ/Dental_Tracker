import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { supabase } from './lib/supabase';
import { useEffect, useState } from 'react';
import Welcome from './screens/Welcome';
import SignIn from './screens/SignIn';
import CreateAccount from './screens/CreateAccount';
import Dashboard from './screens/Dashboard';
import CheckEmail from './screens/CheckEmail';
import AuthCallback from './screens/AuthCallback';
import ToothChart from './screens/ToothChart';
import Appointments from './screens/Appointments';
import Records from './screens/Records';
import ShareAccess from './screens/ShareAccess';
import ProviderDashboard from './screens/provider/ProviderDashboard';
import PatientDetail from './screens/provider/PatientDetail';
import Settings from './screens/Settings';
import WellnessQuizPreview from './screens/preview/WellnessQuizPreview';

function App() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('');

  console.log('App component rendering with user:', user ? user.email : 'null');

  // Fetch user's role from profiles when user changes
  useEffect(() => {
    console.log('useEffect triggered with user:', user ? user.email : 'null');
    if (user) {
      const fetchRole = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (!error && data) {
            setUserRole(data.role);
            console.log('User role fetched:', data.role);
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
          // If error, role remains unset (will default to patient behavior)
        }
      };
      fetchRole();
    }
  }, [user]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  const ProtectedProviderRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    if (userRole !== 'provider') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Patient Dashboard - only for patients */}
        <Route
          path="/dashboard"
          element={
            userRole === 'provider' ? (
              <Navigate to="/provider/dashboard" replace />
            ) : (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )
          }
        />
        {/* Patient-only screens */}
        <Route
          path="/tooth-chart"
          element={
            <ProtectedRoute>
              <ToothChart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/records"
          element={
            <ProtectedRoute>
              <Records />
            </ProtectedRoute>
          }
        />
        <Route
          path="/share-access"
          element={
            <ProtectedRoute>
              <ShareAccess />
            </ProtectedRoute>
          }
        />
        {/* Settings route */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        {/* Preview route for wellness quiz (no auth required for preview) */}
        <Route
          path="/preview/wellness-quiz"
          element={
            <WellnessQuizPreview />
          }
        />
        {/* Provider section */}
        <Route
          path="/provider/*"
          element={
            <ProtectedProviderRoute>
              <Routes>
                <Route path="dashboard" element={<ProviderDashboard />} />
                <Route path="patient/:patientId" element={<PatientDetail />} />
              </Routes>
            </ProtectedProviderRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;