import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { downloadExport } from '../../lib/download';
import { notify } from '../../lib/feedback';

interface Props {
  endpoint: string;
  filename: string;
  disabled?: boolean;
}

export default function ExportButtons({ endpoint, filename, disabled }: Props) {
  const [busy, setBusy] = useState<'csv' | 'pdf' | null>(null);

  const run = async (format: 'csv' | 'pdf') => {
    setBusy(format);
    try {
      const sep = endpoint.includes('?') ? '&' : '?';
      await downloadExport(`${endpoint}${sep}format=${format}`, `${filename}.${format}`);
      notify.success(format === 'csv' ? 'CSV téléchargé' : 'PDF téléchargé');
    } catch (err) {
      notify.error(err, 'Export impossible.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => run('csv')}
        disabled={disabled || !!busy}
        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl flex items-center gap-2 text-sm disabled:opacity-50"
      >
        {busy === 'csv' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        CSV
      </button>
      <button
        type="button"
        onClick={() => run('pdf')}
        disabled={disabled || !!busy}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center gap-2 text-sm disabled:opacity-50"
      >
        {busy === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
        PDF
      </button>
    </div>
  );
}
