import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedProject, allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const project = localStorage.getItem('project');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ✅ Αν είναι admin, του επιτρέπεται παντού
  if (role === 'admin') {
    return <Outlet />;
  }

  // Αν υπάρχει περιορισμός ρόλου και δεν ταιριάζει
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  // Αν υπάρχει περιορισμός project και δεν ταιριάζει
  if (allowedProject && project !== allowedProject) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;