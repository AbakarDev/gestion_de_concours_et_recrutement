import React, { useState, useEffect } from 'react';
import { UploadCloud, File, AlertCircle, Eye, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { documentsApi, dossierApi } from '../../api';
import type { ApplicationDocument, DocumentTypeCatalog } from '../../types';
import DocumentViewerModal from '../../components/documents/DocumentViewerModal';
import { AnimatePresence } from 'framer-motion';
import { notify } from '../../lib/feedback';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import PageHeader from '../../components/ui/PageHeader';

export default function CandidateDocuments() {
  const confirm = useConfirm();
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [catalog, setCatalog] = useState<DocumentTypeCatalog[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('cni');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<{ id: number; title: string } | null>(null);

  const uploadable = catalog.filter(t => !t.generated);

  const labelOf = (code: string) => catalog.find(t => t.code === code)?.label || code;

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const [docsRes, typesRes] = await Promise.all([
        documentsApi.list(),
        dossierApi.types(),
      ]);
      setDocuments(docsRes.data.data || []);
      setCatalog(typesRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      await documentsApi.upload(formData);
      notify.success('Pièce versée au dossier');
      setFile(null);
      fetchDocuments();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors du téléversement';
      setError(message);
      notify.error(err, message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Retirer cette pièce ?',
      description: 'La pièce sera retirée de votre coffre-fort.',
      confirmLabel: 'Retirer',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await documentsApi.delete(id);
      notify.success('Pièce retirée');
      fetchDocuments();
    } catch (err) {
      notify.error(err, 'Erreur lors de la suppression.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        kicker="Dossier"
        title="Pièces justificatives"
        subtitle="Versez les originaux scannés exigés par l’administration (CNI, acte de naissance, casier, diplômes). Le CV et la lettre sont générés dans Mon dossier."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 glass-card p-6 h-fit">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <UploadCloud className="text-blue-700" size={20} />
            Nouvelle pièce
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nature de la pièce</label>
              <select value={type} onChange={e => setType(e.target.value)} className="input-field w-full text-sm">
                {uploadable.map(t => (
                  <option key={t.code} value={t.code}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Fichier (PDF, JPG, PNG — 5 Mo max)</label>
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100">
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  {file ? (
                    <>
                      <File className="w-8 h-8 text-blue-700 mb-2" />
                      <p className="text-xs text-slate-800 font-medium truncate max-w-[180px]">{file.name}</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500">Cliquez pour téléverser</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
              </label>
            </div>
            <button type="submit" disabled={!file || uploading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              {uploading ? <><Loader2 size={16} className="animate-spin" /> Téléversement…</> : <>Verser la pièce</>}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Pièces en ligne ({documents.length})</h3>
          {loadingDocs ? (
            <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
              <Loader2 size={20} className="animate-spin text-blue-700" /> Chargement…
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-xl p-6">
              <FileText size={36} className="mx-auto mb-3 text-slate-400" />
              <p className="text-sm font-medium">Aucune pièce versée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-700"><FileText size={20} /></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{doc.type_label || labelOf(doc.type)}</p>
                      <p className="text-xs text-slate-500">Ajouté le {doc.created_at ? new Date(doc.created_at).toLocaleDateString('fr-FR') : '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button onClick={() => setActiveDoc({ id: doc.id, title: doc.type_label || doc.type })} className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg text-xs font-medium flex items-center gap-1.5">
                      <Eye size={14} /> Consulter
                    </button>
                    <button onClick={() => documentsApi.download(doc.id, doc.type)} className="p-1.5 text-slate-500 hover:text-slate-900" title="Télécharger">
                      <Download size={16} />
                    </button>
                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-red-600" title="Supprimer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activeDoc && (
          <DocumentViewerModal documentId={activeDoc.id} title={activeDoc.title} onClose={() => setActiveDoc(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
