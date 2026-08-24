import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import AuthShell from '../../components/public/AuthShell';
import { authApi } from '../../api';
import { dashboardPath } from '../../lib/dashboardPath';

export default function OtpLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(email, 'email');
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Envoi du code impossible.');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email, code, 'email');
      const payload = res.data.data as any;
      localStorage.setItem('auth_token', payload.access_token);
      if (payload.refresh_token) localStorage.setItem('refresh_token', payload.refresh_token);
      localStorage.setItem('auth_user', JSON.stringify(payload.user));
      navigate(dashboardPath(payload.user?.roles), { replace: true });
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      kicker="Compte"
      title="Connexion par code"
      subtitle="Le code n’est envoyé qu’à la boîte mail du titulaire du compte. Connaître l’e-mail ne suffit pas."
    >
      <form onSubmit={sent ? verify : send} className="auth-card space-y-4">
        {error ? (
          <p className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
          </p>
        ) : null}
        <input className="input-field" type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        {sent ? (
          <>
            <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              Si un compte existe, le code a été envoyé à cette adresse. Il expire au bout de quelques minutes.
            </p>
            <input
              className="input-field tracking-[0.4em] text-center text-lg"
              required
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
            />
          </>
        ) : null}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Patientez…' : sent ? 'Valider le code' : 'Recevoir le code'}
        </button>
        <p className="text-center text-sm"><Link to="/login" className="text-blue-800 font-semibold">Connexion par mot de passe</Link></p>
      </form>
    </AuthShell>
  );
}
