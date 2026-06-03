import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLES } from '../utils/constants';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import NotFoundPage from '../pages/NotFoundPage';
import ForbiddenPage from '../pages/ForbiddenPage';
import LandingPage from '../pages/public/LandingPage';
import CourseCatalogPage from '../pages/public/CourseCatalogPage';
import CourseDetailPage from '../pages/public/CourseDetailPage';
import PaymentSuccessPage from '../pages/public/PaymentSuccessPage';
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ApplyInstructorPage from '../pages/student/ApplyInstructorPage';
import MyCoursesPage from '../pages/student/MyCoursesPage';
import StudentDashboardPage from '../pages/student/StudentDashboardPage';
import ManageCoursesPage from '../pages/instructor/ManageCoursesPage';
import CourseFormPage from '../pages/instructor/CourseFormPage';
import ManageSectionsPage from '../pages/instructor/ManageSectionsPage';
import InstructorDashboardPage from '../pages/instructor/InstructorDashboardPage';
import AdminApplicationsPage from '../pages/admin/AdminApplicationsPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminCoursesPage from '../pages/admin/AdminCoursesPage';

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
        path: '/courses',
        element: <CourseCatalogPage />,
      },
      {
        path: '/courses/:id',
        element: <CourseDetailPage />,
      },
      {
        path: '/payment/success',
        element: <PaymentSuccessPage />,
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

  // Student routes — ProtectedRoute checks auth, DashboardLayout provides sidebar
  {
    element: <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.INSTRUCTOR]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/student/dashboard',
            element: <StudentDashboardPage />,
          },
          {
            path: '/student/my-courses',
            element: <MyCoursesPage />,
          },
          {
            path: '/student/apply-instructor',
            element: <ApplyInstructorPage />,
          },
        ],
      },
    ],
  },

  // Instructor routes
  {
    element: <ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/instructor/dashboard',
            element: <InstructorDashboardPage />,
          },
          {
            path: '/instructor/courses',
            element: <ManageCoursesPage />,
          },
          {
            path: '/instructor/courses/new',
            element: <CourseFormPage />,
          },
          {
            path: '/instructor/courses/:id/edit',
            element: <CourseFormPage />,
          },
          {
            path: '/instructor/courses/:id/content',
            element: <ManageSectionsPage />,
          },
        ],
      },
    ],
  },

  // Admin routes
  {
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/admin/dashboard',
            element: <AdminDashboardPage />,
          },
          {
            path: '/admin/users',
            element: <AdminUsersPage />,
          },
          {
            path: '/admin/courses',
            element: <AdminCoursesPage />,
          },
          {
            path: '/admin/applications',
            element: <AdminApplicationsPage />,
          },
        ],
      },
    ],
  },

  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
