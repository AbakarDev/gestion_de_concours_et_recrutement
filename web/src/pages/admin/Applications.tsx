import { useEffect, useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { applicationsApi } from '../../api';
import type { Application } from '../../types';
import ApplicationDetailsModal from '../../components/applications/ApplicationDetailsModal';
import { AnimatePresence } from 'framer-motion';
import StatusBadge from '../../components/ui/StatusBadge';
import ExportButtons from '../../components/ui/ExportButtons';
import PageHeader from '../../components/ui/PageHeader';
import { useDebounce } from '../../hooks/useDebounce';
import { averageScore, formatDateFr, formatTimeFr } from '../../utils/format';

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await applicationsApi.list({
        page,
        search: debouncedSearch,
        status: statusFilter,
        per_page: 10,
      });
      setApplications(res.data.data);
      setTotalPages(res.data.meta?.last_page || 1);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, debouncedSearch, statusFilter]);

  const exportQuery = new URLSearchParams(
    Object.fromEntries(
      Object.entries({ search, status: statusFilter }).filter(([, v]) => Boolean(v))
    )
  ).toString();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Instruction"
        title="Candidatures"
        subtitle="Évaluez et gérez les dossiers des candidats."
        actions={
          <ExportButtons
            endpoint={`/exports/applications${exportQuery ? `?${exportQuery}` : ''}`}
            filename="candidatures"
          />
        }
      />

      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher (Numéro, Nom, NNI)..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field w-48"
            >
              <option value="">Tous les statuts</option>
              <option value="submitted">Soumise</option>
              <option value="under_review">En évaluation</option>
              <option value="accepted">Acceptée</option>
              <option value="evaluated">Évaluée (Jury)</option>
              <option value="rejected">Rejetée</option>
            </select>
          </div>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="text-xs text-slate-400 font-medium">Légende :</span>
          {[
            { s: 'submitted', l: 'Soumise' },
            { s: 'under_review', l: 'En cours' },
            { s: 'evaluated', l: 'Évaluée' },
            { s: 'accepted', l: 'Acceptée' },
            { s: 'rejected', l: 'Rejetée' },
          ].map(({ s, l }) => (
            <StatusBadge key={s} status={s} label={l} />
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 ">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>N° Dossier</th>
                <th>Candidat</th>
                <th>Poste visé</th>
                <th>Date soumission</th>
                <th>Statut</th>
                <th>Moyenne</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Aucune candidature trouvée.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-medium text-slate-800">{app.application_number}</td>
                    <td>
                      <p className="text-slate-800 font-medium">{app.user ? `${app.user.first_name} ${app.user.last_name}` : '—'}</p>
                      <p className="text-xs text-slate-400">NNI: {app.user?.nin || '—'}</p>
                    </td>
                    <td>
                      <p className="text-slate-800 font-medium">{app.job_offer?.title}</p>
                      <p className="text-xs text-blue-700">{app.job_offer?.competition_title}</p>
                    </td>
                    <td>
                      <p className="text-slate-600">{formatDateFr(app.submitted_at)}</p>
                      {app.submitted_at && (
                        <p className="text-xs text-slate-400">à {formatTimeFr(app.submitted_at)}</p>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={app.status} label={app.status_label} />
                    </td>
                    <td className="font-bold text-blue-700">
                      {averageScore(app.scores)}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="p-2 text-slate-500 hover:text-blue-400 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
                        title="Voir les détails"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-sm text-slate-400">Page {page} sur {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedApplication && (
          <ApplicationDetailsModal
            applicationId={selectedApplication.id}
            onClose={() => setSelectedApplication(null)}
            onUpdated={() => {
              fetchApplications();
              // Optionnel: on peut laisser la modale ouverte pour voir la màj, ou fermer
              // setSelectedApplication(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
