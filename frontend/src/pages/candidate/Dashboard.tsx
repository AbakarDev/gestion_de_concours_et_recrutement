import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, Trophy, ChevronRight, UploadCloud, User } from 'lucide-react';
import { applicationsApi, competitionsApi, jobOffersApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ applications: 0, competitions: 0, offers: 0 });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [appRes, compRes, jobRes] = await Promise.all([
          applicationsApi.list({ per_page: 5 }),
          competitionsApi.list({ status: 'published', per_page: 1 }),
          jobOffersApi.list({ per_page: 1 }),
        ]);
        setStats({
          applications: (appRes.data as any).meta?.total || appRes.data.data.length,
          competitions: (compRes.data as any).meta?.total || 0,
          offers: (jobRes.data as any).meta?.total || 0,
        });
        setRecentApps(appRes.data.data.slice(0, 4));
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Espace candidat"
        title={`Bienvenue, ${user?.first_name ?? ''}`}
        subtitle="Suivez vos dossiers et consultez les concours publiés."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { to: '/candidate/applications', icon: FileText, label: 'Mes candidatures', value: stats.applications, hint: 'Voir mes dossiers' },
          { to: '/candidate/offers', icon: Trophy, label: 'Concours ouverts', value: stats.competitions, hint: 'Voir les concours' },
          { to: '/candidate/offers', icon: Briefcase, label: 'Postes disponibles', value: stats.offers, hint: 'Explorer les offres' },
        ].map(({ to, icon: Icon, label, value, hint }) => (
          <Link key={label} to={to} className="app-stat group block">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                <p className="text-3xl font-bold text-slate-900 tabular-nums">{loading ? '—' : value}</p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-800 group-hover:gap-2 transition-all">
              {hint} <ChevronRight size={13} />
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-blue-800" /> Candidatures récentes
            </h3>
            <Link to="/candidate/applications" className="text-xs font-semibold text-blue-800 hover:text-blue-600 flex items-center gap-1">
              Tout voir <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : recentApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <FileText size={32} className="text-slate-300" />
              <p className="text-sm">Aucune candidature pour le moment</p>
              <Link to="/candidate/offers" className="text-xs font-semibold text-blue-800 hover:underline">Postuler à une offre →</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentApps.map((app: any) => (
                <div key={app.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800 font-mono">#{app.application_number}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{app.job_offer?.title || 'Offre'}</p>
                  </div>
                  <StatusBadge status={app.status} label={app.status_label} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5 space-y-2.5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Actions rapides</h3>
          {[
            { to: '/candidate/offers', icon: Briefcase, title: 'Parcourir les offres', desc: 'Postes et concours publiés' },
            { to: '/candidate/documents', icon: UploadCloud, title: 'Gérer mes documents', desc: 'CV, diplômes, pièce d’identité' },
            { to: '/candidate/profile', icon: User, title: 'Compléter mon profil', desc: 'Informations personnelles' },
          ].map(({ to, icon: Icon, title, desc }) => (
            <Link key={to} to={to} className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-100 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-blue-800 flex items-center justify-center shrink-0">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{title}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-700 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
