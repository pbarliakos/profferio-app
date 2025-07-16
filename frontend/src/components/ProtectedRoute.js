import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedProject, allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const project = localStorage.getItem('project');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Αν ο χρήστης έχει ρόλο admin και δεν του επιτρέπεται να δει admin
  if (allowedRole === 'admin' && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Αν project δεν ταιριάζει
  if (allowedProject && project !== allowedProject) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
