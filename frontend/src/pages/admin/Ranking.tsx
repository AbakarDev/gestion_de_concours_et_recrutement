import { useState } from 'react';
import { Trophy, Medal, TrendingUp, Users, Loader2, AlertCircle } from 'lucide-react';
import { rankingApi, jobOffersApi } from '../../api';
import { useEffect } from 'react';
import { rankingDossierLabel } from '../../lib/anonymat';
import ExportButtons from '../../components/ui/ExportButtons';
import PageHeader from '../../components/ui/PageHeader';

interface RankEntry {
  rank: number;
  anonymat_number?: string | null;
  application_number?: string | null;
  average_score: number | null;
  scores_count: number;
  status: string;
  status_label: string;
}

export default function RankingPage() {
  const [jobOffers, setJobOffers] = useState<any[]>([]);
  const [selectedJobOffer, setSelectedJobOffer] = useState('');
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [jobOfferTitle, setJobOfferTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await jobOffersApi.list({ per_page: 100 });
        setJobOffers(res.data.data || []);
      } catch { /* ignore */ }
      finally { setLoadingOffers(false); }
    };
    fetchOffers();
  }, []);

  const handleLoadRanking = async () => {
    if (!selectedJobOffer) return;
    setLoading(true);
    try {
      const res = await rankingApi.getByJobOffer(Number(selectedJobOffer));
      setRanking(res.data.data || []);
      setJobOfferTitle(res.data.job_offer?.title || '');
    } catch (err) {
      console.error('Failed to load ranking', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={18} className="text-amber-600" />;
    if (rank === 2) return <Medal size={18} className="text-slate-600" />;
    if (rank === 3) return <Medal size={18} className="text-amber-600" />;
    return <span className="text-slate-400 font-bold text-sm w-[18px] text-center">{rank}</span>;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-400';
    if (score >= 16) return 'text-green-700';
    if (score >= 12) return 'text-blue-700';
    if (score >= 10) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        kicker="Résultats"
        title="Classement des candidats"
        subtitle="Résultats anonymisés par ordre de mérite."
        actions={ranking.length > 0 && selectedJobOffer ? (
          <ExportButtons
            endpoint={`/exports/ranking/${selectedJobOffer}`}
            filename={`classement_${jobOfferTitle.replace(/\s+/g, '_')}`}
          />
        ) : undefined}
      />

      {/* Sélection du poste */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-600 mb-2">Sélectionner un poste</label>
            <select
              value={selectedJobOffer}
              onChange={(e) => { setSelectedJobOffer(e.target.value); setRanking([]); }}
              className="w-full input-field"
              disabled={loadingOffers}
            >
              <option value="">-- Choisir un poste --</option>
              {jobOffers.map((jo: any) => (
                <option key={jo.id} value={jo.id}>{jo.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleLoadRanking}
              disabled={!selectedJobOffer || loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
              Afficher le classement
            </button>
          </div>
        </div>
      </div>

      {/* Tableau de classement */}
      {ranking.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              {jobOfferTitle} — {ranking.length} candidat(s) classé(s)
            </h3>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span> ≥ 16</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> ≥ 12</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span> ≥ 10</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span> &lt; 10</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-400 uppercase bg-white">
                <tr>
                  <th className="px-5 py-3 font-medium">Rang</th>
                  <th className="px-5 py-3 font-medium text-left">N° Anonymat</th>
                  <th className="px-5 py-3 font-medium text-center">Moyenne / 20</th>
                  <th className="px-5 py-3 font-medium text-center">Épreuves notées</th>
                  <th className="px-5 py-3 font-medium text-right">Statut</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry) => (
                  <tr
                    key={entry.anonymat_number ?? entry.application_number ?? entry.rank}
                    className={`border-b border-slate-200 transition-colors ${
                      entry.rank === 1 ? 'bg-yellow-500/5' :
                      entry.rank === 2 ? 'bg-gray-500/5' :
                      entry.rank === 3 ? 'bg-amber-700/5' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{rankingDossierLabel(entry)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-2xl font-bold ${getScoreColor(entry.average_score)}`}>
                        {entry.average_score !== null ? entry.average_score.toFixed(2) : '-'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-500">{entry.scores_count}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {entry.status_label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && ranking.length === 0 && selectedJobOffer && (
        <div className="glass-card p-10 text-center text-slate-400">
          <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-slate-500">Aucune évaluation disponible pour ce poste.</p>
          <p className="text-sm mt-1">Le jury doit d'abord évaluer les candidats acceptés ou en cours d'évaluation.</p>
        </div>
      )}
    </div>
  );
}
