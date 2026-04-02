import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';

// Lazy-loaded pages — each route only loads when first visited
const LoginPage             = lazy(() => import('@/pages/Auth/LoginPage'));
const RegisterPage          = lazy(() => import('@/pages/Auth/RegisterPage'));
const DashboardPage         = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const WorkoutListPage       = lazy(() => import('@/pages/Workout/WorkoutListPage'));
const WorkoutStartPage      = lazy(() => import('@/pages/Workout/WorkoutStartPage'));
const WorkoutSessionPage    = lazy(() => import('@/pages/Workout/WorkoutSessionPage'));
const WorkoutDetailPage     = lazy(() => import('@/pages/Workout/WorkoutDetailPage'));
const NutritionDashboard    = lazy(() => import('@/pages/Nutrition/NutritionDashboard'));
const SupplementsPage       = lazy(() => import('@/pages/Supplements/SupplementsPage'));
const ProgressPage          = lazy(() => import('@/pages/Progress/ProgressPage'));
const ProgramListPage       = lazy(() => import('@/pages/Programs/ProgramListPage'));
const ProgramDetailPage     = lazy(() => import('@/pages/Programs/ProgramDetailPage'));
const ProgramCreatePage     = lazy(() => import('@/pages/Programs/ProgramCreatePage'));
const CommunityProgramsPage = lazy(() => import('@/pages/Programs/CommunityProgramsPage'));
const SettingsPage          = lazy(() => import('@/pages/Settings/SettingsPage'));
const ChatPage              = lazy(() => import('@/pages/Chat/ChatPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

function PublicRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: '/login',    element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/',                      element: <DashboardPage /> },
          { path: '/workouts',              element: <WorkoutListPage /> },
          { path: '/workouts/start',        element: <WorkoutStartPage /> },
          { path: '/workouts/new',          element: <WorkoutSessionPage /> },
          { path: '/workouts/:id',          element: <WorkoutDetailPage /> },
          { path: '/nutrition',             element: <NutritionDashboard /> },
          { path: '/supplements',           element: <SupplementsPage /> },
          { path: '/progress',              element: <ProgressPage /> },
          { path: '/programs',              element: <ProgramListPage /> },
          { path: '/programs/create',       element: <ProgramCreatePage /> },
          { path: '/programs/community',    element: <CommunityProgramsPage /> },
          { path: '/programs/:id',          element: <ProgramDetailPage /> },
          { path: '/settings',              element: <SettingsPage /> },
          { path: '/chat',                  element: <ChatPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
