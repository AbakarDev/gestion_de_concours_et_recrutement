import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Loader2, Eye, XCircle, CheckCircle, ChevronRight, Download } from 'lucide-react';
import { applicationsApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import ApplicationDetailsModal from '../../components/applications/ApplicationDetailsModal';
import { AnimatePresence } from 'framer-motion';
import StatusBadge from '../../components/ui/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';
import FeePaymentPanel from '../../components/payments/FeePaymentPanel';

export default function CandidateApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { user } = useAuth();

  const fetchApplications = async () => {
    try {
      const res = await applicationsApi.list({ per_page: 50 });
      setApplications(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchApplications();
  }, [user]);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
        <Loader2 size={24} className="animate-spin text-blue-700"/>
        <span>Chargement de vos candidatures...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        kicker="Suivi"
        title="Mes candidatures"
        subtitle="Suivez l'état d'avancement de vos dossiers."
        actions={
          <Link to="/candidate/offers" className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
            Postuler <ChevronRight size={16}/>
          </Link>
        }
      />

      {applications.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <FileText size={48} className="mx-auto mb-4 text-slate-500 opacity-60"/>
          <p className="text-slate-600 font-semibold text-lg mb-1">Aucune candidature soumise</p>
          <p className="text-slate-400 text-sm mb-6">Découvrez les offres disponibles et postulez dès maintenant.</p>
          <Link to="/candidate/offers" className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-2">
            Voir les offres d'emploi <ChevronRight size={16}/>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app: any) => (
            <div
              key={app.id}
              className="glass-card p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-500/10 text-blue-700 rounded-xl shrink-0">
                  <FileText size={22}/>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">
                    Dossier #{app.application_number}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">
                    {app.job_offer?.title || `Offre #${app.job_offer_id}`}
                  </p>
                  {app.job_offer?.competition_title && (
                    <p className="text-xs text-blue-700 mt-0.5">{app.job_offer.competition_title}</p>
                  )}
                  <div className="text-xs text-slate-400 mt-2">
                    Soumis le {new Date(app.submitted_at || app.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                {<StatusBadge status={app.status} label={app.status_label} />}

                {/* Message selon statut */}
                {app.status === 'accepted' && (
                  <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                    <CheckCircle size={12}/> Félicitations ! Dossier validé
                  </span>
                )}
                {app.status === 'rejected' && (
                  <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <XCircle size={12}/> Dossier non retenu
                  </span>
                )}

                {app.payment?.required && !app.payment?.confirmed && (
                  <div className="w-full md:w-80">
                    <FeePaymentPanel
                      applicationId={app.id}
                      amount={app.payment.montant}
                      phoneDefault={user?.phone}
                      onPaid={fetchApplications}
                    />
                  </div>
                )}
                {app.payment?.required && app.payment?.confirmed && (
                  <span className="text-xs text-green-700 font-medium">Frais réglés</span>
                )}

                <button
                  onClick={() => setSelectedId(app.id)}
                  className="px-4 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-blue-700 border border-primary-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Eye size={14}/> Voir les détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedId && (
          <ApplicationDetailsModal
            applicationId={selectedId}
            onClose={() => setSelectedId(null)}
            onUpdated={fetchApplications}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
