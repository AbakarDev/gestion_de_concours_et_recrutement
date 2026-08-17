import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { jobOffersApi } from '../../api';
import type { JobOffer, Competition } from '../../types';
import { notify } from '../../lib/feedback';

interface Props {
  jobOffer: JobOffer | null;
  competitions: Competition[];
  onClose: () => void;
  onSaved: () => void;
}

export default function JobOfferFormModal({ jobOffer, competitions, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState({
    competition_id: '',
    title: '',
    description: '',
    positions_count: 1,
    location: '',
    fee_required: false,
    fee_amount: 0,
    closing_date: '',
  });
  
  const [requirements, setRequirements] = useState<{ key: string; value: string }[]>([
    { key: 'Niveau', value: '' },
    { key: 'Expérience', value: '' }
  ]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (jobOffer) {
      setFormData({
        competition_id: jobOffer.competition_id.toString(),
        title: jobOffer.title,
        description: jobOffer.description || '',
        positions_count: jobOffer.positions_count,
        location: jobOffer.location || '',
        fee_required: !!jobOffer.fee_required,
        fee_amount: Number(jobOffer.fee_amount || 0),
        closing_date: jobOffer.closing_date || '',
      });
      if (jobOffer.requirements) {
        setRequirements(
          Object.entries(jobOffer.requirements).map(([key, value]) => ({ key, value }))
        );
      }
    }
  }, [jobOffer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const formattedReqs: Record<string, string> = {};
      requirements.forEach(req => {
        if (req.key.trim() && req.value.trim()) {
          formattedReqs[req.key.trim()] = req.value.trim();
        }
      });

      const payload = {
        ...formData,
        competition_id: parseInt(formData.competition_id),
        requirements: Object.keys(formattedReqs).length > 0 ? formattedReqs : undefined,
        closing_date: formData.closing_date || null,
        fee_amount: formData.fee_required ? formData.fee_amount : null,
      };

      if (jobOffer) {
        await jobOffersApi.update(jobOffer.id, payload);
        notify.success('Offre mise à jour');
      } else {
        await jobOffersApi.create(payload);
        notify.success('Offre créée');
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

  const addRequirement = () => {
    setRequirements([...requirements, { key: '', value: '' }]);
  };

  const updateRequirement = (index: number, field: 'key' | 'value', val: string) => {
    const newReqs = [...requirements];
    newReqs[index][field] = val;
    setRequirements(newReqs);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
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
            {jobOffer ? 'Modifier le poste' : 'Nouveau poste'}
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

          <form id="job-offer-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Concours rattaché</label>
              <select
                required
                value={formData.competition_id}
                onChange={e => setFormData({ ...formData, competition_id: e.target.value })}
                className="input-field"
              >
                <option value="">Sélectionner...</option>
                {competitions.map(comp => (
                  <option key={comp.id} value={comp.id}>{comp.title} ({comp.reference})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">Titre du poste</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Ingénieur Informatique"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">Nombre de positions</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={formData.positions_count}
                  onChange={e => setFormData({ ...formData, positions_count: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Localisation</label>
              <input
                type="text"
                placeholder="Ex: N'Djamena"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Description</label>
              <textarea
                rows={3}
                placeholder="Missions, conditions..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="input-field resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">Date limite de candidature</label>
                <input
                  type="date"
                  value={formData.closing_date}
                  onChange={e => setFormData({ ...formData, closing_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.fee_required}
                    onChange={e => setFormData({ ...formData, fee_required: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Frais de dossier
                </label>
                {formData.fee_required && (
                  <input
                    type="number"
                    min="0"
                    placeholder="Montant FCFA"
                    value={formData.fee_amount}
                    onChange={e => setFormData({ ...formData, fee_amount: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-500">Critères dynamiques (JSON)</label>
                <button type="button" onClick={addRequirement} className="text-xs text-blue-700 hover:text-blue-800 flex items-center gap-1">
                  <Plus size={14} /> Ajouter un critère
                </button>
              </div>
              
              <div className="space-y-2">
                {requirements.map((req, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Clé (ex: Diplôme)"
                      value={req.key}
                      onChange={e => updateRequirement(i, 'key', e.target.value)}
                      className="input-field flex-1"
                    />
                    <span className="text-slate-400">:</span>
                    <input
                      type="text"
                      placeholder="Valeur (ex: Bac+5)"
                      value={req.value}
                      onChange={e => updateRequirement(i, 'value', e.target.value)}
                      className="input-field flex-[2]"
                    />
                    <button type="button" onClick={() => removeRequirement(i)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {requirements.length === 0 && (
                  <div className="text-sm text-slate-400 italic">Aucun critère spécifique.</div>
                )}
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
            form="job-offer-form"
            disabled={isSaving}
            className="btn-primary disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {jobOffer ? 'Mettre à jour' : 'Créer le poste'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
