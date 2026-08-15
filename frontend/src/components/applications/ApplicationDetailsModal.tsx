import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, FileText, Clock, User, Briefcase, Calendar, Mail, Phone, Hash, Download, Eye } from 'lucide-react';
import { applicationsApi, documentsApi } from '../../api';
import type { Application, Score } from '../../types';
import DocumentViewerModal from '../documents/DocumentViewerModal';
import { useAuth } from '../../contexts/AuthContext';
import { ApplicationInstructors, Role } from '../../lib/roles';
import { notify } from '../../lib/feedback';
import { useConfirm } from '../ui/ConfirmProvider';
import StatusBadge from '../ui/StatusBadge';

interface Props {
  applicationId: number;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ApplicationDetailsModal({ applicationId, onClose, onUpdated }: Props) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeDocument, setActiveDocument] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await applicationsApi.get(applicationId);
        setApplication(res.data.data);
        setAdminNotes(res.data.data.admin_notes || '');
        setRejectionReason(res.data.data.rejection_reason || '');
      } catch (err) {
        console.error('Failed to fetch application details', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [applicationId]);

  const handleUpdateStatus = async (status: 'under_review' | 'accepted' | 'rejected') => {
    if (status === 'rejected' && rejectionReason.trim().length < 5) {
      notify.warning('Motif de rejet requis', 'Indiquez un motif d’au moins 5 caractères.');
      return;
    }

    if (status === 'rejected') {
      const ok = await confirm({
        title: 'Rejeter ce dossier ?',
        description: 'Le candidat sera notifié avec le motif saisi. Cette décision est tracée dans l’historique.',
        confirmLabel: 'Rejeter',
        variant: 'danger',
      });
      if (!ok) return;
    }

    setIsUpdating(true);
    try {
      const res = await applicationsApi.updateStatus(applicationId, {
        status,
        admin_notes: adminNotes,
        rejection_reason: status === 'rejected' ? rejectionReason.trim() : undefined,
      });
      setApplication(res.data.data);
      notify.success('Statut mis à jour');
      onUpdated();
    } catch (err) {
      notify.error(err, 'Erreur lors de la mise à jour du statut.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownload = async (docId: number, docType: string) => {
    try {
      const candidateFile = application?.user
        ? `${application.user.first_name}_${application.user.last_name}`
        : 'candidat';
      await documentsApi.download(docId, `${docType}_${candidateFile}`);
    } catch (err) {
      notify.error(err, 'Erreur lors du téléchargement du fichier.');
    }
  };

  const isAdminOrValidation = user?.roles.some(r => (ApplicationInstructors as readonly string[]).includes(r));
  const isCandidate = user?.roles.some(r => r.toLowerCase() === Role.Candidat);

  if (isLoading || !application) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const candidateName = application.user
    ? `${application.user.first_name} ${application.user.last_name}`
    : 'Candidat';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              Dossier {application.application_number}
              <StatusBadge status={application.status} label={application.status_label} />
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Soumis le {new Date(application.submitted_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Colonne gauche : Infos candidat & poste */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <User size={18} className="text-blue-400" />
                  Informations du candidat
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Nom Complet</p>
                      <p className="text-sm text-slate-800 font-medium">{application.user ? `${application.user.first_name} ${application.user.last_name}` : 'Identité masquée'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Hash size={12}/> NNI</p>
                      <p className="text-sm text-slate-800 font-medium">{application.user?.nin || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Mail size={12}/> Email</p>
                      <p className="text-sm text-slate-800 font-medium">{application.user?.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Phone size={12}/> Téléphone</p>
                      <p className="text-sm text-slate-800 font-medium">{application.user?.phone || 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-700" />
                  Poste visé
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Poste</p>
                    <p className="text-sm text-slate-800 font-medium">{application.job_offer.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Concours</p>
                    <p className="text-sm text-slate-800">{application.job_offer.competition_title}</p>
                  </div>
                </div>
              </div>
              
              {/* Convocation (visible par le candidat ou admin si validé) */}
              {application.status === 'accepted' && application.convocation_url && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <FileText size={18} className="text-blue-400" />
                    Convocation aux épreuves
                  </h4>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                    <p className="text-sm text-blue-800 text-center">Votre candidature a été validée. Vous pouvez maintenant télécharger votre convocation.</p>
                    <a
                      href={application.convocation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full text-center flex items-center justify-center gap-2"
                    >
                      <Download size={16} /> Télécharger ma convocation (PDF)
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite : Documents & Actions */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-amber-600" />
                  Documents soumis ({application.documents?.length || 0})
                </h4>
                <div className="space-y-2">
                  {!application.documents || application.documents.length === 0 ? (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200">Aucun document attaché à ce dossier.</p>
                  ) : (
                    application.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{doc.type}</p>
                            <p className="text-xs text-slate-500">
                              {doc.created_at ? `Ajouté le ${new Date(doc.created_at).toLocaleDateString()}` : 'Document vérifié'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveDocument({
                              id: doc.id,
                              title: `${doc.type} - ${candidateName}`
                            })}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Eye size={14} />
                            Consulter
                          </button>

                          {isAdminOrValidation && (
                            <button
                              onClick={() => handleDownload(doc.id, doc.type)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Télécharger"
                            >
                              <Download size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {isAdminOrValidation && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800">Évaluation du dossier</h4>
                  <div className="space-y-3">
                    <label className="block text-sm text-slate-500">Notes de l'agent (visibles en interne)</label>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Saisissez vos observations sur ce dossier..."
                      className="input-field resize-none w-full"
                    />

                    <label className="block text-sm text-slate-500">Motif de rejet (obligatoire en cas de rejet)</label>
                    <textarea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Ex. : diplôme requis non fourni, dossier incomplet…"
                      className="input-field resize-none w-full"
                    />
                    
                    <div className="flex flex-wrap gap-3 pt-2">
                      {application.status === 'submitted' && (
                        <button
                          onClick={() => handleUpdateStatus('under_review')}
                          disabled={isUpdating}
                          className="flex-1 min-w-[140px] px-4 py-2.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                          <Clock size={16} /> Passer en évaluation
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleUpdateStatus('accepted')}
                        disabled={isUpdating || application.status === 'accepted'}
                        className="flex-1 min-w-[140px] px-4 py-2.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={16} /> Valider le dossier
                      </button>

                      <button
                        onClick={() => handleUpdateStatus('rejected')}
                        disabled={isUpdating || application.status === 'rejected'}
                        className="flex-1 min-w-[140px] px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={16} /> Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {application.status === 'rejected' && application.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                  <p className="font-semibold mb-1">Motif du rejet</p>
                  <p>{application.rejection_reason}</p>
                </div>
              )}

              {application.status_history && application.status_history.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Clock size={18} className="text-blue-700" />
                    Historique du dossier
                  </h4>
                  <ol className="space-y-2">
                    {application.status_history.map((entry) => (
                      <li key={entry.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          {entry.from_status && <StatusBadge status={entry.from_status} size="sm" />}
                          <span className="text-slate-400">→</span>
                          <StatusBadge status={entry.to_status} size="sm" />
                        </div>
                        {entry.reason && <p className="text-slate-600 mt-1.5">{entry.reason}</p>}
                        <p className="text-xs text-slate-400 mt-1">
                          {entry.changed_by ? `${entry.changed_by} · ` : ''}
                          {entry.created_at ? new Date(entry.created_at).toLocaleString('fr-FR') : ''}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Historique des Notes du Jury */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <FileText size={18} className="text-blue-400" />
                    Notes du Jury
                  </span>
                  {application.scores && application.scores.length > 0 && (
                    <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm rounded-lg font-bold">
                      Moyenne: {(application.scores.reduce((acc, curr) => acc + parseFloat(curr.note as unknown as string), 0) / application.scores.length).toFixed(2)} / 20
                    </span>
                  )}
                </h4>
                <div className="space-y-2">
                  {!application.scores || application.scores.length === 0 ? (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200">Aucune évaluation n'a été saisie par le jury.</p>
                  ) : (
                    application.scores.map((score: any) => (
                      <div key={score.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-semibold text-slate-800">{score.epreuve}</p>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg font-bold">
                            {score.note} / 20
                          </span>
                        </div>
                        {score.commentaire && (
                          <p className="text-xs text-slate-500 mt-2 bg-slate-100 p-2 rounded border border-slate-200">
                            "{score.commentaire}"
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-2 text-right">
                          Évalué le {new Date(score.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal pour afficher la pièce jointe */}
      <AnimatePresence>
        {activeDocument && (
          <DocumentViewerModal
            documentId={activeDocument.id}
            title={activeDocument.title}
            onClose={() => setActiveDocument(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

