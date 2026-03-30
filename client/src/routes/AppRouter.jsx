import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLES } from '../utils/constants';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import NotFoundPage from '../pages/NotFoundPage';
import ForbiddenPage from '../pages/ForbiddenPage';
import LandingPage from '../pages/public/LandingPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
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
  {
    path: '/forbidden',
    element: <ForbiddenPage />,
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
