import React, { useState, useEffect } from 'react';
import { UploadCloud, File, AlertCircle, Eye, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { documentsApi } from '../../api';
import type { ApplicationDocument } from '../../types';
import DocumentViewerModal from '../../components/documents/DocumentViewerModal';
import { AnimatePresence } from 'framer-motion';
import { notify } from '../../lib/feedback';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import PageHeader from '../../components/ui/PageHeader';

export default function CandidateDocuments() {
  const confirm = useConfirm();
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('CV');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<{ id: number; title: string } | null>(null);

  const documentTypes = ['CV', 'Lettre de motivation', 'Diplôme', 'CNI', 'Attestation'];

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await documentsApi.list();
      setDocuments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

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
      notify.success('Document téléversé');
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
      title: 'Supprimer ce document ?',
      description: 'Cette action est définitive.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await documentsApi.delete(id);
      notify.success('Document supprimé');
      fetchDocuments();
    } catch (err) {
      notify.error(err, 'Erreur lors de la suppression du document.');
    }
  };

  const handleDownload = async (doc: ApplicationDocument) => {
    try {
      await documentsApi.download(doc.id, doc.type);
    } catch (err) {
      notify.error(err, 'Erreur lors du téléchargement.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        kicker="Dossier"
        title="Mes pièces justificatives"
        subtitle="Téléversez et consultez vos documents (CV, diplômes, pièce d’identité)."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire de téléversement */}
        <div className="lg:col-span-1 glass-card p-6 h-fit">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <UploadCloud className="text-blue-700" size={20} />
            Nouveau document
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Type de document</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-field w-full text-sm"
              >
                {documentTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Fichier (PDF, JPG, PNG - Max 5MB)</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-colors">
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    {file ? (
                      <>
                        <File className="w-8 h-8 text-blue-700 mb-2" />
                        <p className="text-xs text-slate-800 font-medium truncate max-w-[180px]">{file.name}</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
                        <p className="text-xs text-slate-500"><span className="font-semibold text-blue-700">Cliquez pour téléverser</span></p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Téléversement...
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  Téléverser le document
                </>
              )}
            </button>
          </form>
        </div>

        {/* Liste des documents existants */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center justify-between">
            <span>Documents en ligne</span>
            <span className="text-xs text-slate-500 font-normal">{documents.length} document(s)</span>
          </h3>

          {loadingDocs ? (
            <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
              <Loader2 size={20} className="animate-spin text-blue-700" />
              <span>Chargement de vos documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-xl p-6">
              <FileText size={36} className="mx-auto mb-3 text-slate-400 opacity-60" />
              <p className="text-sm font-medium text-slate-600">Aucun document en ligne</p>
              <p className="text-xs text-slate-400 mt-1">Téléversez votre CV et vos diplômes pour postuler plus rapidement.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-500/10 rounded-xl text-blue-700 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{doc.type}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ajouté le {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Récemment'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setActiveDoc({ id: doc.id, title: doc.type })}
                      className="px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-blue-700 border border-primary-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Eye size={14} />
                      Consulter
                    </button>

                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Télécharger"
                    >
                      <Download size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Supprimer"
                    >
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

