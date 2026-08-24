import { useState } from 'react';
import { Search, ShieldCheck, ShieldX } from 'lucide-react';
import PublicHeader from '../../components/public/PublicHeader';
import axios from 'axios';

const apiRoot = (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:8001/api';

export default function VerifyConvocationPage() {
  const [token, setToken] = useState(new URLSearchParams(window.location.search).get('token') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; data?: any } | null>(null);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.get(`${apiRoot}/convocations/verify/${encodeURIComponent(token.trim())}`);
      setResult({ ok: true, message: res.data.message, data: res.data.data });
    } catch (err: any) {
      setResult({
        ok: false,
        message: err.response?.data?.message || 'Convocation introuvable ou falsifiée.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicHeader homePrimary />
      <div className="max-w-xl mx-auto w-full px-4 py-12">
        <p className="page-kicker mb-2">Contrôle d’authenticité</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Vérifier une convocation</h1>
        <p className="text-slate-500 text-sm mb-6">Saisissez le jeton imprimé sur le QR code du PDF.</p>
        <form onSubmit={verify} className="glass-card p-6 space-y-4">
          <input className="input-field" required placeholder="Jeton / QR" value={token} onChange={(e) => setToken(e.target.value)} />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            <Search size={16} />
            {loading ? 'Vérification…' : 'Vérifier'}
          </button>
        </form>
        {result ? (
          <div className={`mt-6 glass-card p-6 ${result.ok ? 'border-emerald-200' : 'border-red-200'}`}>
            <div className="flex items-center gap-2 font-semibold mb-3">
              {result.ok ? <ShieldCheck className="text-emerald-600" /> : <ShieldX className="text-red-600" />}
              {result.message}
            </div>
            {result.data ? (
              <dl className="text-sm space-y-1 text-slate-600">
                <p><span className="font-medium text-slate-800">Candidat :</span> {result.data.candidate_name}</p>
                <p><span className="font-medium text-slate-800">Dossier :</span> {result.data.application_number}</p>
                <p><span className="font-medium text-slate-800">Concours :</span> {result.data.competition}</p>
                <p><span className="font-medium text-slate-800">Poste :</span> {result.data.job_offer}</p>
              </dl>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
