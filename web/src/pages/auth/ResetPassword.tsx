import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import AuthShell from '../../components/public/AuthShell';
import { authApi } from '../../api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get('email') || '');
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Jeton invalide ou mot de passe trop faible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell kicker="Compte" title="Nouveau mot de passe" subtitle="Collez le jeton reçu par e-mail (ou dans les logs Laravel en démo locale).">
      <form onSubmit={submit} className="auth-card space-y-4">
        {error ? (
          <p className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
          </p>
        ) : null}
        <input className="input-field" type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input-field" required placeholder="Jeton" value={token} onChange={(e) => setToken(e.target.value)} />
        <input className="input-field" type="password" required placeholder="Nouveau mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="input-field" type="password" required placeholder="Confirmation" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Enregistrement…' : 'Réinitialiser'}</button>
        <p className="text-center text-sm"><Link to="/login" className="text-blue-800 font-semibold">Connexion</Link></p>
      </form>
    </AuthShell>
  );
}
