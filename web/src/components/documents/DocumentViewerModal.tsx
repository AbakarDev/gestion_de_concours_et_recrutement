import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, ExternalLink, FileText, Loader2, AlertCircle } from 'lucide-react';
import { documentsApi } from '../../api';
import { notify } from '../../lib/feedback';

interface DocumentViewerModalProps {
  documentId: number;
  title: string;
  onClose: () => void;
}

export default function DocumentViewerModal({ documentId, title, onClose }: DocumentViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadDocument = async () => {
      try {
        setLoading(true);
        const url = await documentsApi.viewBlob(documentId);
        if (active) {
          setBlobUrl(url);
        }
      } catch (err: any) {
        if (active) {
          setError(err.response?.data?.message || 'Impossible de charger le document.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDocument();

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [documentId]);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await documentsApi.download(documentId, `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
    } catch (err) {
      notify.error(err, 'Erreur lors du téléchargement du document.');
    } finally {
      setIsDownloading(false);
    }
  };

  const openInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 ">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>
              <p className="text-xs text-slate-500">Visualisation sécurisée de la pièce jointe</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {blobUrl && (
              <button
                onClick={openInNewTab}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-2"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink size={14} />
                Plein écran
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-2"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Télécharger
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-950/60 p-4 flex items-center justify-center overflow-auto relative">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 size={36} className="animate-spin text-blue-500" />
              <p className="text-sm font-medium">Chargement du document...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-red-600 max-w-md text-center p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={36} />
              <p className="font-semibold text-slate-800">Échec du chargement</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          ) : blobUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <iframe
                src={blobUrl}
                title={title}
                className="w-full h-full rounded-xl border border-slate-200 bg-white"
              />
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
