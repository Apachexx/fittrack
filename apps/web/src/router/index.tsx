import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import WorkoutListPage from '@/pages/Workout/WorkoutListPage';
import WorkoutSessionPage from '@/pages/Workout/WorkoutSessionPage';
import WorkoutDetailPage from '@/pages/Workout/WorkoutDetailPage';
import NutritionDashboard from '@/pages/Nutrition/NutritionDashboard';
import ProgressPage from '@/pages/Progress/ProgressPage';
import ProgramListPage from '@/pages/Programs/ProgramListPage';
import ProgramDetailPage from '@/pages/Programs/ProgramDetailPage';
import ProgramCreatePage from '@/pages/Programs/ProgramCreatePage';
import SettingsPage from '@/pages/Settings/SettingsPage';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PublicRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/workouts', element: <WorkoutListPage /> },
          { path: '/workouts/new', element: <WorkoutSessionPage /> },
          { path: '/workouts/:id', element: <WorkoutDetailPage /> },
          { path: '/nutrition', element: <NutritionDashboard /> },
          { path: '/progress', element: <ProgressPage /> },
          { path: '/programs', element: <ProgramListPage /> },
          { path: '/programs/create', element: <ProgramCreatePage /> },
          { path: '/programs/:id', element: <ProgramDetailPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
