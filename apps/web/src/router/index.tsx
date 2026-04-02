import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import WorkoutListPage from '@/pages/Workout/WorkoutListPage';
import WorkoutStartPage from '@/pages/Workout/WorkoutStartPage';
import WorkoutSessionPage from '@/pages/Workout/WorkoutSessionPage';
import WorkoutDetailPage from '@/pages/Workout/WorkoutDetailPage';
import NutritionDashboard from '@/pages/Nutrition/NutritionDashboard';
import ProgressPage from '@/pages/Progress/ProgressPage';
import ProgramListPage from '@/pages/Programs/ProgramListPage';
import ProgramDetailPage from '@/pages/Programs/ProgramDetailPage';
import ProgramCreatePage from '@/pages/Programs/ProgramCreatePage';
import CommunityProgramsPage from '@/pages/Programs/CommunityProgramsPage';
import SettingsPage from '@/pages/Settings/SettingsPage';
import ChatPage from '@/pages/Chat/ChatPage';
import SupplementsPage from '@/pages/Supplements/SupplementsPage';

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
          { path: '/workouts/start', element: <WorkoutStartPage /> },
          { path: '/workouts/new', element: <WorkoutSessionPage /> },
          { path: '/workouts/:id', element: <WorkoutDetailPage /> },
          { path: '/nutrition', element: <NutritionDashboard /> },
          { path: '/supplements', element: <SupplementsPage /> },
          { path: '/progress', element: <ProgressPage /> },
          { path: '/programs', element: <ProgramListPage /> },
          { path: '/programs/create', element: <ProgramCreatePage /> },
          { path: '/programs/community', element: <CommunityProgramsPage /> },
          { path: '/programs/:id', element: <ProgramDetailPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/chat', element: <ChatPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
