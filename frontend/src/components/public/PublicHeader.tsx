import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardPath } from '../../lib/dashboardPath';

type PublicHeaderProps = {
  right?: ReactNode;
  /** Si true, le bouton Accueil est le CTA principal (pages 403/404). */
  homePrimary?: boolean;
};

export default function PublicHeader({ right, homePrimary = false }: PublicHeaderProps) {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-header-wrap">
      <div className="home-flag" />
      <header className="home-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
              <span className="text-white font-bold text-xs tracking-tight">RT</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-slate-900 leading-none tracking-tight truncate">
                E-Concours <span className="text-blue-700">Tchad</span>
              </p>
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-[0.14em] mt-1 truncate">
                République du Tchad
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className={
                homePrimary
                  ? 'btn-primary text-sm py-2 px-4 inline-flex items-center gap-2'
                  : 'inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 transition-colors'
              }
            >
              {homePrimary ? <Home size={15} /> : <ArrowLeft size={15} />}
              <span className="hidden sm:inline">{homePrimary ? "Retour à l'accueil" : 'Accueil'}</span>
              <span className="sm:hidden">Accueil</span>
            </Link>
            {isAuthenticated && (
              <Link
                to={dashboardPath(user?.roles)}
                className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-800 px-3 py-2 rounded-xl hover:bg-slate-50"
              >
                <LayoutDashboard size={15} />
                Mon espace
              </Link>
            )}
            {right}
          </div>
        </div>
      </header>
    </div>
  );
}
