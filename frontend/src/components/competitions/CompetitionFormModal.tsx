import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { competitionsApi } from '../../api';
import type { Competition, Department } from '../../types';
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
  const [documents, setDocuments] = useState<string[]>(['CV', 'Lettre de motivation']);
  const [newDoc, setNewDoc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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

  const addDocument = () => {
    if (newDoc.trim() && !documents.includes(newDoc.trim())) {
      setDocuments([...documents, newDoc.trim()]);
      setNewDoc('');
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
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
              <label className="text-sm font-medium text-slate-500">Documents obligatoires</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nom du document (ex: Copie CNI)"
                  value={newDoc}
                  onChange={e => setNewDoc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDocument())}
                  className="input-field"
                />
                <button type="button" onClick={addDocument} className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors">
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {documents.map((doc, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm">
                    {doc}
                    <button type="button" onClick={() => removeDocument(i)} className="p-0.5 hover:bg-blue-500/20 rounded-md transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {documents.length === 0 && <span className="text-sm text-slate-400">Aucun document requis.</span>}
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
