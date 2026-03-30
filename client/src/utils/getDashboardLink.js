import { ROLES } from './constants';

export function getDashboardLink(role) {
  if (role === ROLES.ADMIN) return '/admin/dashboard';
  if (role === ROLES.INSTRUCTOR) return '/instructor/dashboard';
  return '/student/dashboard';
}
