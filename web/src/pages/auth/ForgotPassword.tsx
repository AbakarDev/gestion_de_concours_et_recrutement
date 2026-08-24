import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthShell from '../../components/public/AuthShell';
import { authApi } from '../../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Demande impossible. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell kicker="Compte" title="Mot de passe oublié" subtitle="Un lien de réinitialisation est envoyé si le compte existe (en local : voir storage/logs).">
      <div className="auth-card">
        {done ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="mx-auto text-emerald-600" size={36} />
            <p className="text-slate-700 text-sm leading-relaxed">
              Si un compte existe pour <strong>{email}</strong>, un jeton de réinitialisation a été généré.
            </p>
            <Link to="/reset-password" className="btn-primary inline-flex">Continuer vers la réinitialisation</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {error ? (
              <p className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600">Adresse e-mail</label>
              <input className="input-field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              <Mail size={16} />
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
            <p className="text-center text-sm">
              <Link to="/login" className="text-blue-800 font-semibold">Retour à la connexion</Link>
            </p>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
