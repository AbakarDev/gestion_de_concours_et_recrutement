import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, MapPin, Briefcase, Eye } from 'lucide-react';
import { jobOffersApi, competitionsApi } from '../../api';
import type { JobOffer, Competition } from '../../types';
import JobOfferFormModal from '../../components/job-offers/JobOfferFormModal';
import StatusBadge from '../../components/ui/StatusBadge';
import { notify } from '../../lib/feedback';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import ExportButtons from '../../components/ui/ExportButtons';
import PageHeader from '../../components/ui/PageHeader';

export default function JobOffers() {
  const confirm = useConfirm();
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [competitionFilter, setCompetitionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobOffer, setEditingJobOffer] = useState<JobOffer | null>(null);

  const fetchJobOffers = async () => {
    setIsLoading(true);
    try {
      const res = await jobOffersApi.list({
        page,
        search,
        competition_id: competitionFilter,
        status: statusFilter,
        per_page: 10,
      });
      setJobOffers(res.data.data);
      setTotalPages(res.data.meta?.last_page || 1);
    } catch (err) {
      console.error('Failed to fetch job offers', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompetitions = async () => {
    try {
      // Get all open/published competitions for the dropdown
      const res = await competitionsApi.list({ per_page: 100 });
      setCompetitions(res.data.data);
    } catch (err) {
      console.error('Failed to fetch competitions', err);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchJobOffers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [page, search, competitionFilter, statusFilter]);

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Supprimer cette offre ?',
      description: 'Cette action est définitive.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await jobOffersApi.delete(id);
      notify.success('Offre supprimée');
      fetchJobOffers();
    } catch (err) {
      notify.error(err, 'Erreur lors de la suppression.');
    }
  };

    const handlePublishToggle = async (jobOffer: JobOffer) => {
    try {
      if (jobOffer.status === 'draft') {
        const ok = await confirm({
          title: 'Publier cette offre ?',
          confirmLabel: 'Publier',
          variant: 'primary',
        });
        if (!ok) return;
        await jobOffersApi.publish(jobOffer.id);
        notify.success('Offre publiée');
      }
      fetchJobOffers();
    } catch (err: any) {
      notify.error(err, 'Erreur lors de la publication.');
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Recrutement"
        title="Postes & offres"
        subtitle="Gérez les postes ouverts pour les différents concours."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportButtons endpoint="/exports/job-offers" filename="offres" />
            <button
              onClick={() => { setEditingJobOffer(null); setIsModalOpen(true); }}
              className="btn-primary"
            >
              <Plus size={18} />
              Nouveau poste
            </button>
          </div>
        }
      />

      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un poste..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={competitionFilter}
              onChange={(e) => { setCompetitionFilter(e.target.value); setPage(1); }}
              className="input-field w-56"
            >
              <option value="">Tous les concours</option>
              {competitions.map((comp) => (
                <option key={comp.id} value={comp.id}>{comp.title}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field w-40"
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="open">Ouvert</option>
              <option value="closed">Clôturé</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 ">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Poste</th>
                <th>Concours rattaché</th>
                <th>Localisation</th>
                <th>Positions</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : jobOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Aucun poste trouvé.
                  </td>
                </tr>
              ) : (
                jobOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-medium text-slate-800">{offer.title}</td>
                    <td className="text-slate-600">{offer.competition_title}</td>
                    <td>
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <MapPin size={14} className="text-blue-600" />
                        {offer.location || 'Non spécifié'}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Briefcase size={14} className="text-blue-600" />
                        {offer.positions_count}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={offer.status || 'draft'} label={offer.status_label} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {offer.status === 'draft' && (
                          <button onClick={() => handlePublishToggle(offer)} title="Publier l'offre" className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                            <Eye size={16} />
                          </button>
                        )}
                        <button onClick={() => { setEditingJobOffer(offer); setIsModalOpen(true); }} title="Modifier" className="p-2 rounded-lg bg-blue-50 text-[#1B4F8A] hover:bg-blue-100 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(offer.id)} title="Supprimer" className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
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
        {isModalOpen && (
          <JobOfferFormModal
            jobOffer={editingJobOffer}
            competitions={competitions}
            onClose={() => setIsModalOpen(false)}
            onSaved={() => {
              setIsModalOpen(false);
              fetchJobOffers();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
