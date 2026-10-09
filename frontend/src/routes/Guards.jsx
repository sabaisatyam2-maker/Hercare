import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/States';

const FullLoading = () => <div className="min-h-screen grid place-items-center"><Loading /></div>;

/** Logged-in users only. Non-admins who have not finished onboarding are sent to /onboarding. */
export function ProtectedRoute({ children, requireOnboarding = true }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullLoading />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (requireOnboarding && !user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return children;
};

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullLoading />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

/** Login/register pages: already logged-in users are sent where they belong. */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullLoading />;
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;
  }
  return children;
}
