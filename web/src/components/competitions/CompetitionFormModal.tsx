import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { competitionsApi, dossierApi } from '../../api';
import type { Competition, Department, DocumentTypeCatalog } from '../../types';
import { notify } from '../../lib/feedback';

interface Props {
  competition: Competition | null;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}

export default function CompetitionFormModal({ competition, departments, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState({
    department_id: '',
    title: '',
    reference: '',
    description: '',
    quota: 1,
    start_date: '',
    end_date: '',
    registration_open_date: '',
    registration_close_date: '',
    fee_required: false,
    fee_amount: 0,
  });
  const [documents, setDocuments] = useState<string[]>([
    'photo_identite', 'cni', 'acte_naissance', 'diplome', 'casier_judiciaire', 'cv_officiel',
  ]);
  const [catalog, setCatalog] = useState<DocumentTypeCatalog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dossierApi.types().then(res => setCatalog(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (competition) {
      setFormData({
        department_id: competition.department_id.toString(),
        title: competition.title,
        reference: competition.reference,
        description: competition.description || '',
        quota: competition.quota,
        start_date: competition.start_date,
        end_date: competition.end_date,
        registration_open_date: competition.registration_open_date || '',
        registration_close_date: competition.registration_close_date || '',
        fee_required: !!competition.fee_required,
        fee_amount: Number(competition.fee_amount || 0),
      });
      if (competition.required_documents) {
        setDocuments(competition.required_documents);
      }
    }
  }, [competition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        department_id: parseInt(formData.department_id),
        required_documents: documents,
        registration_open_date: formData.registration_open_date || null,
        registration_close_date: formData.registration_close_date || null,
        fee_amount: formData.fee_required ? formData.fee_amount : null,
      };

      if (competition) {
        await competitionsApi.update(competition.id, payload);
        notify.success('Concours mis à jour');
      } else {
        await competitionsApi.create(payload);
        notify.success('Concours créé');
      }
      onSaved();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la sauvegarde.';
      setError(message);
      notify.error(err, message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDocument = (code: string) => {
    setDocuments(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">
            {competition ? 'Modifier le concours' : 'Nouveau concours'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form id="competition-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">Ministère</label>
                <select
                  required
                  value={formData.department_id}
                  onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Sélectionner...</option>
                  {departments.map(dep => (
                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">Référence</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: MIN-2026-01"
                  value={formData.reference}
                  onChange={e => setFormData({ ...formData, reference: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Titre du concours</label>
              <input
                required
                type="text"
                placeholder="Ex: Concours d'entrée à l'ENAM"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Description</label>
              <textarea
                rows={3}
                placeholder="Description et modalités..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="input-field resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">Quota de places</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={formData.quota}
                  onChange={e => setFormData({ ...formData, quota: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">Date de début</label>
                <input
                  required
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">Date de fin</label>
                <input
                  required
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">Ouverture des inscriptions</label>
                <input
                  type="date"
                  value={formData.registration_open_date}
                  onChange={e => setFormData({ ...formData, registration_open_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">Clôture des inscriptions</label>
                <input
                  type="date"
                  value={formData.registration_close_date}
                  onChange={e => setFormData({ ...formData, registration_close_date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="flex items-center gap-2 text-sm text-slate-600 pt-6">
                <input
                  type="checkbox"
                  checked={formData.fee_required}
                  onChange={e => setFormData({ ...formData, fee_required: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Frais de dossier requis
              </label>
              {formData.fee_required && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-500">Montant (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.fee_amount}
                    onChange={e => setFormData({ ...formData, fee_amount: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <label className="text-sm font-medium text-slate-500">Pièces exigées par l’avis (catalogue ministériel)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(catalog.length ? catalog : []).map(item => (
                  <label key={item.code} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <input
                      type="checkbox"
                      checked={documents.includes(item.code)}
                      onChange={() => toggleDocument(item.code)}
                      className="mt-0.5 rounded border-slate-300"
                    />
                    <span>
                      {item.label}
                      {item.generated && <span className="block text-xs text-slate-400">Généré par la plateforme</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-white">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
            Annuler
          </button>
          <button
            type="submit"
            form="competition-form"
            disabled={isSaving}
            className="btn-primary disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {competition ? 'Mettre à jour' : 'Créer le concours'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
