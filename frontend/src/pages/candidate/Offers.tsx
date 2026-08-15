import React, { useEffect, useState } from 'react';
import { Briefcase, MapPin, Building2, AlertCircle, UploadCloud } from 'lucide-react';
import { jobOffersApi, applicationsApi, documentsApi } from '../../api';
import type { JobOffer } from '../../types';
import { notify } from '../../lib/feedback';
import PageHeader from '../../components/ui/PageHeader';

export default function CandidateOffers() {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  
  // Application Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('CV');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await jobOffersApi.list();
      setOffers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch offers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (offer: JobOffer) => {
    setSelectedOffer(offer);
    setShowApplyModal(true);
    setErrorMsg(null);
    setFile(null);
  };

  const handleConfirmApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Submit Application
      const appRes = await applicationsApi.create({ job_offer_id: selectedOffer.id });
      const applicationId = appRes.data.data.id;

      // 2. Upload Document if selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', docType);
        formData.append('application_id', applicationId.toString());
        await documentsApi.upload(formData);
      }

      notify.success('Candidature soumise');
      setShowApplyModal(false);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la soumission.';
      setErrorMsg(message);
      notify.error(err, message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-slate-800 text-center mt-10">Chargement des offres...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      <PageHeader
        kicker="Recrutement"
        title="Offres et concours"
        subtitle="Consultez les postes publiés et déposez votre dossier."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offers.map(offer => (
          <div key={offer.id} className="glass-card p-6 flex flex-col hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{offer.title}</h3>
                <p className="text-sm text-blue-700 font-medium">{offer.competition_title}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Briefcase size={20} />
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={16} />
                {offer.location || 'N/D'}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Building2 size={16} />
                {offer.positions_count} poste(s) à pourvoir
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-200">
              <button 
                onClick={() => handleApplyClick(offer)}
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-slate-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Postuler maintenant
              </button>
            </div>
          </div>
        ))}
      </div>

      {offers.length === 0 && (
        <div className="text-center text-slate-500 py-10 glass-card">
          Aucune offre disponible pour le moment.
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Postuler : {selectedOffer.title}</h3>
            <p className="text-sm text-slate-500 mb-6">Remplissez les informations et joignez votre pièce principale pour finaliser votre dossier.</p>

            {errorMsg && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <p>{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleConfirmApply} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Pièce jointe (optionnelle)</label>
                  <div className="flex gap-2">
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-1/3 input-field text-sm"
                    >
                      <option value="CV">CV</option>
                      <option value="Lettre de motivation">Lettre de motivation</option>
                      <option value="Diplôme">Diplôme</option>
                    </select>
                    
                    <label className="flex-1 flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors text-slate-600 rounded-xl cursor-pointer px-4">
                      {file ? (
                        <span className="text-sm truncate text-slate-800 max-w-[150px]">{file.name}</span>
                      ) : (
                        <>
                          <UploadCloud size={18} />
                          <span className="text-sm">Choisir un fichier...</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
                      }} />
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Formats acceptés : PDF, JPG, PNG. Taille max : 5Mo.</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="btn-ghost text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Envoi en cours...' : 'Confirmer et Postuler'}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
}
