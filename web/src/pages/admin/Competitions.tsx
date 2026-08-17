import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, Eye, EyeOff, Users, Lock, Undo2 } from 'lucide-react';
import { competitionsApi, departmentsApi } from '../../api';
import type { Competition, Department } from '../../types';
import CompetitionFormModal from '../../components/competitions/CompetitionFormModal';
import StatusBadge from '../../components/ui/StatusBadge';
import { notify } from '../../lib/feedback';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import ExportButtons from '../../components/ui/ExportButtons';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../lib/roles';
import PageHeader from '../../components/ui/PageHeader';

export default function Competitions() {
  const confirm = useConfirm();
  const { hasRole } = useAuth();
  const canManage = hasRole(Role.SuperAdmin) || hasRole(Role.ResponsableConcours);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);

  const fetchCompetitions = async () => {
    setIsLoading(true);
    try {
      const res = await competitionsApi.list({
        page,
        search,
        status: statusFilter,
        department_id: departmentFilter,
        per_page: 10,
      });
      setCompetitions(res.data.data);
      setTotalPages(res.data.meta?.last_page || 1);
    } catch (err) {
      console.error('Failed to fetch competitions', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentsApi.list();
      setDepartments(res.data.data);
    } catch (err) {
      console.error('Failed to fetch departments', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCompetitions();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [page, search, statusFilter, departmentFilter]);

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Supprimer ce concours ?',
      description: 'Cette action est définitive. Les données associées pourront être impactées.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await competitionsApi.delete(id);
      notify.success('Concours supprimé');
      fetchCompetitions();
    } catch (err) {
      notify.error(err, 'Erreur lors de la suppression.');
    }
  };

  const handlePublishToggle = async (competition: Competition) => {
    try {
      if (competition.status === 'draft') {
        const ok = await confirm({
          title: 'Publier ce concours ?',
          description: 'Il deviendra visible et les candidatures pourront être ouvertes selon les dates.',
          confirmLabel: 'Publier',
          variant: 'primary',
        });
        if (!ok) return;
        await competitionsApi.publish(competition.id);
        notify.success('Concours publié');
      } else if (['published', 'open'].includes(competition.status)) {
        const ok = await confirm({
          title: 'Dépublier ce concours ?',
          description: 'Il redeviendra un brouillon et ne sera plus visible publiquement.',
          confirmLabel: 'Dépublier',
          variant: 'danger',
        });
        if (!ok) return;
        await competitionsApi.unpublish(competition.id);
        notify.success('Concours dépublié');
      }
      fetchCompetitions();
    } catch (err: any) {
      notify.error(err, 'Erreur lors de la modification du statut.');
    }
  };

  const handleClose = async (competition: Competition) => {
    const ok = await confirm({
      title: 'Clôturer ce concours ?',
      description: 'Aucune candidature ne sera plus acceptée.',
      confirmLabel: 'Clôturer',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await competitionsApi.close(competition.id);
      notify.success('Concours clôturé');
      fetchCompetitions();
    } catch (err: any) {
      notify.error(err, 'Erreur lors de la clôture.');
    }
  };

  const handlePublishResults = async (competition: Competition) => {
    const ok = await confirm({
      title: 'Publier les résultats ?',
      description: 'Les classements seront figés et les notes du jury verrouillées. Cette action est définitive.',
      confirmLabel: 'Publier les résultats',
      variant: 'primary',
    });
    if (!ok) return;
    try {
      await competitionsApi.publishResults(competition.id);
      notify.success('Résultats publiés', 'Les notes sont désormais verrouillées.');
      fetchCompetitions();
    } catch (err: any) {
      notify.error(err, 'Impossible de publier les résultats.');
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Organisation"
        title="Concours"
        subtitle="Gérez les concours de recrutement de la fonction publique."
        actions={
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons endpoint="/exports/competitions" filename="concours" />
          {canManage && (
          <button
            onClick={() => { setEditingCompetition(null); setIsModalOpen(true); }}
            className="btn-primary"
          >
            <Plus size={18} />
            Nouveau concours
          </button>
          )}
        </div>
        }
      />

      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un concours (titre, ref)..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
              className="input-field w-40"
            >
              <option value="">Tous les ministères</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
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
              <option value="evaluating">En évaluation</option>
              <option value="closed">Clôturé</option>
              <option value="archived">Archivé</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 ">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Titre / Ministère</th>
                <th>Période</th>
                <th>Quota</th>
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
              ) : competitions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Aucun concours trouvé.
                  </td>
                </tr>
              ) : (
                competitions.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-mono text-xs text-slate-500">{comp.reference}</td>
                    <td>
                      <p className="text-slate-800 font-medium">{comp.title}</p>
                      <p className="text-xs text-blue-700">{comp.department_name}</p>
                    </td>
                    <td>
                      <p className="text-slate-600">{new Date(comp.start_date).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-400">au {new Date(comp.end_date).toLocaleDateString()}</p>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Users size={14} className="text-blue-600" />
                        {comp.quota} places
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={comp.status} label={comp.status_label} />
                        {comp.results_published_at && (
                          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Résultats publiés</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canManage && comp.status === 'draft' && (
                          <button onClick={() => handlePublishToggle(comp)} title="Publier" className="p-2 text-slate-500 hover:text-emerald-700 rounded-xl hover:bg-slate-100 transition-colors">
                            <Eye size={16} />
                          </button>
                        )}
                        {canManage && ['published', 'open'].includes(comp.status) && (
                          <>
                            <button onClick={() => handlePublishToggle(comp)} title="Dépublier" className="p-2 text-slate-500 hover:text-amber-700 rounded-xl hover:bg-slate-100 transition-colors">
                              <Undo2 size={16} />
                            </button>
                            <button onClick={() => handleClose(comp)} title="Clôturer" className="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 transition-colors">
                              <EyeOff size={16} />
                            </button>
                          </>
                        )}
                        {canManage && ['closed', 'evaluating'].includes(comp.status) && !comp.results_published_at && (
                          <button onClick={() => handlePublishResults(comp)} title="Publier les résultats" className="p-2 text-slate-500 hover:text-blue-700 rounded-xl hover:bg-slate-100 transition-colors">
                            <Lock size={16} />
                          </button>
                        )}
                        {canManage && (
                          <>
                        <button onClick={() => { setEditingCompetition(comp); setIsModalOpen(true); }} className="p-2 text-slate-500 hover:text-blue-700 rounded-xl hover:bg-slate-100 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(comp.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 transition-colors">
                          <Trash2 size={16} />
                        </button>
                          </>
                        )}
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
          <CompetitionFormModal
            competition={editingCompetition}
            departments={departments}
            onClose={() => setIsModalOpen(false)}
            onSaved={() => {
              setIsModalOpen(false);
              fetchCompetitions();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
