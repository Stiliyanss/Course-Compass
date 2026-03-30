import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLES } from '../utils/constants';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import NotFoundPage from '../pages/NotFoundPage';
import ForbiddenPage from '../pages/ForbiddenPage';
import LandingPage from '../pages/public/LandingPage';
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';

const router = createBrowserRouter([
  // Public routes — wrapped with Navbar + Footer
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/forbidden',
        element: <ForbiddenPage />,
      },
    ],
  },

  // Auth routes — wrapped with dark glass card + logo
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
    ],
  },

  // Student routes
  {
    element: <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.INSTRUCTOR]} />,
    children: [
      {
        path: '/student/dashboard',
        element: <div>Student Dashboard (coming soon)</div>,
      },
    ],
  },

  // Instructor routes
  {
    element: <ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]} />,
    children: [
      {
        path: '/instructor/dashboard',
        element: <div>Instructor Dashboard (coming soon)</div>,
      },
    ],
  },

  // Admin routes
  {
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
    children: [
      {
        path: '/admin/dashboard',
        element: <div>Admin Dashboard (coming soon)</div>,
      },
    ],
  },

  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
