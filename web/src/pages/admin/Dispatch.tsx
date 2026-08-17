import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { competitionsApi } from '../../api';
import { notify } from '../../lib/feedback';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import PageHeader from '../../components/ui/PageHeader';

export default function DispatchPage() {
  const confirm = useConfirm();
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState<number | null>(null);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const res = await competitionsApi.list();
      setCompetitions(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch competitions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (id: number) => {
    const ok = await confirm({
      title: 'Lancer le dispatching ?',
      description: 'Les convocations seront générées pour tous les candidats acceptés de ce concours.',
      confirmLabel: 'Lancer',
      variant: 'primary',
    });
    if (!ok) return;

    setDispatching(id);
    try {
      const res = await competitionsApi.dispatch(id);
      notify.success(res.data.message || 'Dispatching effectué');
    } catch (err: any) {
      console.error('Dispatch failed', err);
      notify.error(err, 'Erreur lors du dispatching.');
    } finally {
      setDispatching(null);
    }
  };

  if (loading) {
    return <div className="text-slate-800 text-center mt-10">Chargement...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        kicker="Centres d'examen"
        title="Dispatching & convocations"
        subtitle="Assignez automatiquement les candidats aux centres d'examen."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {competitions.map((comp) => (
          <div key={comp.id} className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-900">{comp.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${comp.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {comp.status === 'published' ? 'Publié' : 'Brouillon'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6">{comp.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-auto">
              <button
                onClick={() => handleDispatch(comp.id)}
                disabled={dispatching === comp.id}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-slate-800 font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {dispatching === comp.id ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Dispatching en cours...
                  </>
                ) : (
                  <>
                    <MapPin size={18} />
                    Lancer le Dispatching Automatique
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {competitions.length === 0 && (
          <div className="col-span-2 text-center p-12 glass-card">
            <Search className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-500">Aucun concours disponible.</p>
          </div>
        )}
      </div>
    </div>
  );
}
