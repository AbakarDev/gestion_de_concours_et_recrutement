import React, { useEffect, useState } from 'react';
import { Building2, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { departmentsApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../lib/roles';
import { notify } from '../../lib/feedback';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import PageHeader from '../../components/ui/PageHeader';

export default function DepartmentsPage() {
  const { hasRole } = useAuth();
  const confirm = useConfirm();
  const canManage = hasRole(Role.SuperAdmin);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDept, setCurrentDept] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await departmentsApi.list();
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch departments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ name: '', code: '' });
    setIsEditing(false);
    setCurrentDept(null);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (dept: any) => {
    setFormData({ name: dept.name, code: dept.code });
    setIsEditing(true);
    setCurrentDept(dept);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Supprimer ce département ?',
      description: 'Cette action est définitive.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await departmentsApi.delete(id);
      notify.success('Département supprimé');
      fetchDepartments();
    } catch (err) {
      console.error('Failed to delete department', err);
      notify.error(err, 'Erreur lors de la suppression.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (isEditing && currentDept) {
        await departmentsApi.update(currentDept.id, formData);
        notify.success('Département mis à jour');
      } else {
        await departmentsApi.create(formData);
        notify.success('Département créé');
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-slate-800 text-center mt-10">Chargement des départements...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      <PageHeader
        kicker="Organisation"
        title="Départements"
        subtitle="Gérez les organisations et institutions partenaires."
        actions={canManage ? (
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Nouveau département
          </button>
        ) : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept: any) => (
          <div key={dept.id} className="glass-card p-6 hover:bg-slate-50 border border-slate-200 bg-slate-50  transition-all hover:-translate-y-1 relative group">
            {canManage && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              <button 
                onClick={() => handleOpenEdit(dept)}
                className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                title="Modifier"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(dept.id)}
                className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            </div>
            )}
            
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary-500/10 rounded-xl text-blue-700 flex-shrink-0 shadow-soft">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 pr-16">{dept.name}</h3>
                <p className="text-sm text-slate-500 mt-1">Code: <span className="text-blue-700 font-mono font-medium">{dept.code}</span></p>
              </div>
            </div>
          </div>
        ))}
        {departments.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-500 glass-card">
            Aucun département trouvé. Cliquez sur "Nouveau département" pour en ajouter un.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {isEditing ? 'Modifier le département' : 'Nouveau département'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-900">
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500">
                <AlertCircle size={20} />
                <p className="text-sm">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nom du département</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400"
                  placeholder="Ex: Université de N'Djaména"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Code (Identifiant unique)</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400"
                  placeholder="Ex: MIN-EDU-01"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-ghost text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
