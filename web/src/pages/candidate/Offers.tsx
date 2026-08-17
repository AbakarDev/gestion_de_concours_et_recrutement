import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Building2, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { jobOffersApi, applicationsApi, dossierApi } from '../../api';
import type { JobOffer, DossierPayload, Application } from '../../types';
import { notify } from '../../lib/feedback';
import PageHeader from '../../components/ui/PageHeader';
import FeePaymentPanel from '../../components/payments/FeePaymentPanel';
import { useAuth } from '../../contexts/AuthContext';

export default function CandidateOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [dossier, setDossier] = useState<DossierPayload | null>(null);
  const [objet, setObjet] = useState('');
  const [corps, setCorps] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdApplication, setCreatedApplication] = useState<Application | null>(null);

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

  const handleApplyClick = async (offer: JobOffer) => {
    setSelectedOffer(offer);
    setShowApplyModal(true);
    setErrorMsg(null);
    setObjet(`Candidature — ${offer.title}`);
    setCorps('');
    setCreatedApplication(null);
    try {
      const res = await dossierApi.get(offer.id);
      setDossier(res.data.data);
    } catch (err) {
      notify.error(err, 'Impossible de vérifier le dossier.');
    }
  };

  const needsLetter = dossier?.completeness?.checklist?.some(i => i.code === 'lettre_candidature' && i.required);
  const piecesReady = Boolean(dossier) && (dossier?.completeness.checklist || [])
    .filter(i => i.code !== 'lettre_candidature')
    .every(i => i.present);
  const ready = Boolean(piecesReady && (!needsLetter || corps.trim().length >= 200));

  const handleConfirmApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await applicationsApi.create({
        job_offer_id: selectedOffer.id,
        motivation_objet: needsLetter ? objet : undefined,
        motivation_corps: needsLetter ? corps : undefined,
      });
      const application = res.data.data;
      const needsPayment = Boolean(
        selectedOffer.fee_required || application.payment?.required,
      ) && !application.payment?.confirmed;
      if (needsPayment) {
        setCreatedApplication(application);
        notify.success('Dossier déposé', 'Réglez les frais pour débloquer l’instruction.');
      } else {
        notify.success('Dossier déposé');
        setShowApplyModal(false);
      }
    } catch (err: any) {
      const message = err.response?.data?.errors?.dossier?.[0]
        || err.response?.data?.message
        || 'Erreur lors de la soumission.';
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
        subtitle="Consultez les postes publiés et déposez un dossier complet."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offers.map(offer => (
          <div key={offer.id} className="glass-card p-6 flex flex-col hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{offer.title}</h3>
                <p className="text-sm text-blue-700 font-medium">{offer.competition_title}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
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
              {offer.fee_required && (
                <p className="text-xs text-amber-800">
                  Frais de dossier : {Number(offer.fee_amount || 0).toLocaleString('fr-FR')} FCFA
                </p>
              )}
            </div>
            <div className="mt-auto pt-4 border-t border-slate-200">
              <button
                onClick={() => handleApplyClick(offer)}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg transition-colors"
              >
                Déposer un dossier
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

      {showApplyModal && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Dossier : {selectedOffer.title}</h3>
            <p className="text-sm text-slate-500 mb-5">
              Le dépôt n’est possible que si toutes les pièces de l’avis sont constituées. Le CV administratif est généré automatiquement.
            </p>

            {errorMsg && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleConfirmApply} className="space-y-5">
              {createdApplication ? (
                <FeePaymentPanel
                  applicationId={createdApplication.id}
                  amount={createdApplication.payment?.montant ?? selectedOffer.fee_amount}
                  phoneDefault={user?.phone}
                  onPaid={() => {
                    notify.success('Dossier prêt pour l’instruction');
                    setShowApplyModal(false);
                    setCreatedApplication(null);
                  }}
                />
              ) : (
                <>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">Pièces exigées par l’avis</p>
                {(dossier?.completeness.checklist || []).map(item => (
                  <div key={item.code} className="flex items-start gap-2 text-sm">
                    {item.present
                      ? <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
                      : <Circle size={16} className="text-slate-300 mt-0.5 shrink-0" />}
                    <div>
                      <span className={item.present ? 'text-slate-800' : 'text-slate-500'}>{item.label}</span>
                      {item.generated && <span className="text-xs text-slate-400 ml-1">(généré)</span>}
                      {!item.present && <p className="text-xs text-slate-400">{item.hint}</p>}
                    </div>
                  </div>
                ))}
                {!piecesReady && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    Dossier incomplet.{' '}
                    <Link to="/candidate/profile" className="font-semibold underline">Compléter mon dossier</Link>
                    {' · '}
                    <Link to="/candidate/documents" className="font-semibold underline">Pièces justificatives</Link>
                  </p>
                )}
              </div>

              {needsLetter && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">Lettre de candidature</p>
                  <p className="text-xs text-slate-500">
                    Formule administrative générée (destinataire ministériel, objet, politesse). Rédigez uniquement le corps de la lettre (200 caractères minimum).
                  </p>
                  <input className="input-field" value={objet} onChange={e => setObjet(e.target.value)} placeholder="Objet" />
                  <textarea
                    className="input-field min-h-[140px]"
                    value={corps}
                    onChange={e => setCorps(e.target.value)}
                    placeholder="J’ai l’honneur de solliciter…"
                  />
                  <p className="text-xs text-slate-400">{corps.trim().length} / 200 caractères min.</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowApplyModal(false)} className="btn-ghost text-sm">Annuler</button>
                <button type="submit" disabled={submitting || !ready} className="btn-primary text-sm disabled:opacity-50">
                  {submitting ? 'Dépôt en cours…' : 'Confirmer le dépôt'}
                </button>
              </div>
                </>
              )}
              {createdApplication && (
                <div className="flex justify-end pt-2">
                  <button type="button" onClick={() => setShowApplyModal(false)} className="btn-ghost text-sm">Fermer</button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
