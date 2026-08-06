import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Welcome from './screens/Welcome';
import SignIn from './screens/SignIn';
import CreateAccount from './screens/CreateAccount';
import Dashboard from './screens/Dashboard';
import CheckEmail from './screens/CheckEmail';
import AuthCallback from './screens/AuthCallback';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;