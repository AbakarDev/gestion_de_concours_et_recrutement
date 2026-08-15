import { Link, useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft, LogIn, LayoutDashboard } from 'lucide-react';
import PublicHeader from '../../components/public/PublicHeader';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardPath } from '../../lib/dashboardPath';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicHeader homePrimary />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="text-red-600 w-8 h-8" />
          </div>
          <p className="home-kicker mb-2">Accès refusé</p>
          <p className="text-6xl font-black text-blue-900 mb-3 leading-none">403</p>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Vous n'avez pas accès à cette page</h1>
          <p className="text-slate-500 mb-8 leading-relaxed text-sm">
            Ce contenu est réservé à un autre rôle. Revenez à l'accueil du portail
            {isAuthenticated ? ' ou ouvrez votre espace.' : ', ou connectez-vous avec le bon compte.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
            >
              <ArrowLeft size={16} />
              Page précédente
            </button>
            {isAuthenticated ? (
              <Link
                to={dashboardPath(user?.roles)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 btn-primary text-sm"
              >
                <LayoutDashboard size={16} />
                Mon espace
              </Link>
            ) : (
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 btn-primary text-sm"
              >
                <LogIn size={16} />
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
