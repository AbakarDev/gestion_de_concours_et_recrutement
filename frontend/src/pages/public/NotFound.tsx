import { Link, useNavigate } from 'react-router-dom';
import { FileSearch, ArrowLeft } from 'lucide-react';
import PublicHeader from '../../components/public/PublicHeader';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicHeader homePrimary />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileSearch className="text-blue-800 w-8 h-8" />
          </div>
          <p className="home-kicker mb-2">Page introuvable</p>
          <p className="text-6xl font-black text-blue-900 mb-3 leading-none">404</p>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Cette page n'existe pas</h1>
          <p className="text-slate-500 mb-8 leading-relaxed text-sm">
            L'adresse est incorrecte ou la page a été déplacée.
            Revenez à l'accueil pour consulter les concours ouverts.
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
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 btn-primary text-sm"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
