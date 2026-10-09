import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute, GuestRoute, ProtectedRoute } from './routes/Guards';
import { MainLayout } from './components/Layouts';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import DailyLog from './pages/DailyLog';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Workouts from './pages/Workouts';
import WorkoutDetail from './pages/WorkoutDetail';
import Programs from './pages/Programs';
import ProgramDetail from './pages/ProgramDetail';
import MyPrograms from './pages/MyPrograms';
import EnrollmentDetail from './pages/EnrollmentDetail';
import Favorites from './pages/Favorites';
import NotFound from './pages/NotFound';

import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminCategories from './pages/admin/AdminCategories';
import { AdminRecipes, AdminWorkouts, AdminPrograms } from './pages/admin/AdminLists';
import RecipeForm from './pages/admin/RecipeForm';
import WorkoutForm from './pages/admin/WorkoutForm';
import ProgramForm from './pages/admin/ProgramForm';

export default function App() {
  return (
    <Routes>
      {/* Auth pages (no navbar). Email links stay public so they work even when logged in. */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* Admin panel */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminOverview />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="recipes" element={<AdminRecipes />} />
        <Route path="recipes/new" element={<RecipeForm />} />
        <Route path="recipes/:id/edit" element={<RecipeForm />} />
        <Route path="workouts" element={<AdminWorkouts />} />
        <Route path="workouts/new" element={<WorkoutForm />} />
        <Route path="workouts/:id/edit" element={<WorkoutForm />} />
        <Route path="programs" element={<AdminPrograms />} />
        <Route path="programs/new" element={<ProgramForm />} />
        <Route path="programs/:id/edit" element={<ProgramForm />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      {/* Website */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/workouts/:id" element={<WorkoutDetail />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/programs/:id" element={<ProgramDetail />} />

        <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/daily-log" element={<ProtectedRoute><DailyLog /></ProtectedRoute>} />
        <Route path="/my-programs" element={<ProtectedRoute><MyPrograms /></ProtectedRoute>} />
        <Route path="/my-programs/:id" element={<ProtectedRoute><EnrollmentDetail /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
