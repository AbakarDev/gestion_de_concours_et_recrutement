import { useEffect, useState } from 'react';
import { ClipboardList, Shield, CheckCircle, Save, FileText, UserCircle, Eye, Loader2, AlertCircle } from 'lucide-react';
import { applicationsApi, api } from '../../api';
import { AnimatePresence } from 'framer-motion';
import DocumentViewerModal from '../../components/documents/DocumentViewerModal';
import { notify } from '../../lib/feedback';
import { juryDossierLabel } from '../../lib/anonymat';
import PageHeader from '../../components/ui/PageHeader';

export default function EvaluationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [epreuve, setEpreuve] = useState('Entretien Oral');
  const [note, setNote] = useState<number | ''>('');
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedScores, setSavedScores] = useState<Record<number, boolean>>({});
  const [activeDoc, setActiveDoc] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const [accRes, evalRes] = await Promise.all([
        applicationsApi.list({ status: 'accepted', per_page: 50 }),
        applicationsApi.list({ status: 'evaluated', per_page: 50 }),
      ]);
      setApplications([
        ...(accRes.data.data || []),
        ...(evalRes.data.data || []),
      ]);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || note === '') return;
    setSubmitting(true);
    try {
      await api.post(`/applications/${selectedApp.id}/scores`, { epreuve, note, commentaire });
      setSavedScores(prev => ({ ...prev, [selectedApp.id]: true }));
      notify.success('Note enregistrée', 'Un cachet d\'intégrité HMAC a été calculé et stocké.');
      fetchApplications();
      setSelectedApp(null);
      setNote('');
      setCommentaire('');
    } catch (err) {
      console.error('Erreur lors de la notation', err);
      notify.error(err, 'Erreur lors de l\'enregistrement de la note.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
        <Loader2 size={24} className="animate-spin text-blue-600"/>
        <span>Chargement des dossiers à évaluer...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        kicker="Jury"
        title="Grille d'évaluation anonyme"
        subtitle="L'identité et le n° de dossier nominatif sont masqués. Seul le numéro d'anonymat est visible."
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-medium">
            <CheckCircle size={14}/> Anonymat garanti — Conforme CNIL
          </div>
        }
      />

      {applications.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-40"/>
          <p className="font-semibold text-slate-600 text-lg mb-1">Aucun dossier à évaluer</p>
          <p className="text-sm">Les dossiers acceptés apparaîtront ici pour notation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste anonyme */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Dossiers admissibles ({applications.length})
            </h3>
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => { setSelectedApp(app); setNote(''); setCommentaire(''); }}
                  className={`w-full glass-card p-4 cursor-pointer transition-all hover:-translate-y-0.5 text-left ${
                    selectedApp?.id === app.id
                      ? 'ring-2 ring-primary-500/50 bg-primary-500/10 shadow-[0_0_15px_rgba(104,117,245,0.15)]'
                      : 'hover:bg-slate-50 border border-slate-200 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${selectedApp?.id === app.id ? 'bg-primary-500/20 text-blue-700' : 'bg-slate-50 text-slate-500'}`}>
                      <UserCircle size={18}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-900 font-mono font-bold text-sm tracking-wider">{juryDossierLabel(app)}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {app.job_offer?.title || 'Poste'}
                      </div>
                    </div>
                    {savedScores[app.id] && (
                      <CheckCircle size={14} className="text-green-400 shrink-0"/>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Panneau de saisie */}
          <div className="lg:col-span-2">
            {selectedApp ? (
              <div className="glass-card p-6 space-y-6">
                <div className="flex justify-between items-start pb-5 border-b border-slate-200">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Évaluation du dossier</h3>
                    <div className="text-blue-700 font-mono text-lg font-bold">{juryDossierLabel(selectedApp)}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wide">Numéro d'anonymat</div>
                    {selectedApp.job_offer?.title && (
                      <div className="text-xs text-slate-500 mt-1">Poste : <span className="text-slate-600 font-medium">{selectedApp.job_offer.title}</span></div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-medium shadow-sm">
                    <Shield size={12}/> Anonymat garanti
                  </div>
                </div>

                {/* Documents du candidat (anonymes) */}
                {selectedApp.documents && selectedApp.documents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                      <FileText size={14} className="text-amber-600"/> Pièces jointes du dossier
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.documents.map((doc: any) => (
                        <button
                          key={doc.id}
                          onClick={() => setActiveDoc({ id: doc.id, title: `${doc.type} — ${juryDossierLabel(selectedApp)}` })}
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 text-blue-700 rounded-lg text-xs font-medium transition-colors shadow-sm"
                        >
                          <Eye size={12}/> {doc.type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleScoreSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Épreuve évaluée</label>
                      <select
                        value={epreuve}
                        onChange={(e) => setEpreuve(e.target.value)}
                        className="w-full input-field"
                      >
                        <option value="Entretien Oral">Entretien Oral</option>
                        <option value="Test Technique">Test Technique</option>
                        <option value="Épreuve Écrite">Épreuve Écrite (Anonymée)</option>
                        <option value="Test Psychotechnique">Test Psychotechnique</option>
                        <option value="Vérification Dossier">Vérification Dossier</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Note attribuée (sur 20)</label>
                      <input
                        type="number"
                        min="0" max="20" step="0.25"
                        required
                        value={note}
                        onChange={(e) => setNote(parseFloat(e.target.value))}
                        className="w-full text-3xl font-bold text-center input-field py-4"
                        placeholder="-- / 20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Commentaire du jury (optionnel, anonyme)</label>
                    <textarea
                      rows={3}
                      value={commentaire}
                      onChange={e => setCommentaire(e.target.value)}
                      placeholder="Observations sur la prestation (sans mentionner l'identité du candidat)..."
                      className="input-field resize-none w-full"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0"/>
                    <span><strong>Attention :</strong> La note est horodatée et scellée par un cachet HMAC. Une modification hors du flux officiel invaliderait ce cachet.</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedApp(null)}
                      className="px-5 py-2.5 text-sm text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || note === ''}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                      {submitting ? 'Enregistrement sécurisé...' : 'Valider la note définitive'}
                    </button>
                  </div>
                </form>

                {/* Affichage de l'historique des évaluations déjà saisies */}
                {selectedApp.scores && selectedApp.scores.length > 0 && (
                  <div className="pt-6 mt-6 border-t border-slate-200 space-y-4">
                    <h4 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                      <FileText size={14} className="text-blue-400"/>
                      Évaluations précédentes
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedApp.scores.map((s: any) => (
                        <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-500 font-medium">{s.epreuve}</span>
                            <span className="text-xs font-bold px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                              {s.note} / 20
                            </span>
                          </div>
                          {s.commentaire && (
                            <p className="text-xs text-slate-400 mt-2 bg-slate-100 p-2 rounded">
                              "{s.commentaire}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="glass-card h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 p-6 gap-4">
                <ClipboardList size={48} className="opacity-40"/>
                <div className="text-center">
                  <p className="font-medium text-slate-500 mb-1">Sélectionnez un dossier</p>
                  <p className="text-sm max-w-xs">Cliquez sur un numéro d'anonymat dans la liste pour saisir votre évaluation en mode anonyme.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeDoc && (
          <DocumentViewerModal
            documentId={activeDoc.id}
            title={activeDoc.title}
            onClose={() => setActiveDoc(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
