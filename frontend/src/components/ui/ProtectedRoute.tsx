import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ allowedRoles?: string[] }> = ({ allowedRoles }) => {
  const { isAuthenticated, hasRole, isLoading, user } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
    // Redirection intelligente selon le rôle réel
    const roles = user?.roles || [];
    const isCandidat = roles.some(r => r.toLowerCase() === 'candidat');
    const isJury = roles.some(r => r.toLowerCase() === 'jury');
    const isAdmin = roles.some(r =>
      ['superadmin', 'administrateur', 'responsable de concours', 'recruteur'].includes(r.toLowerCase())
    );

    if (isCandidat) return <Navigate to="/candidate" replace />;
    if (isJury)     return <Navigate to="/admin/evaluations" replace />;
    if (isAdmin)    return <Navigate to="/admin" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
