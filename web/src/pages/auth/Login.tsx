import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import AuthShell from '../../components/public/AuthShell';
import { dashboardPath } from '../../lib/dashboardPath';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'superadmin@recrute.td' },
  { label: 'Administrateur', email: 'admin@recrute.td' },
  { label: 'Responsable', email: 'responsable@recrute.td' },
  { label: 'Jury', email: 'jury@recrute.td' },
  { label: 'Recruteur', email: 'recruteur@recrute.td' },
  { label: 'Candidat', email: 'candidat@test.td' },
];

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={dashboardPath(user?.roles)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      navigate(dashboardPath(u?.roles), { replace: true });
    } catch {
      setError('Identifiants incorrects ou compte inactif. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      kicker="Portail public — concours et recrutements"
      title="Concours et recrutements en un seul espace"
      subtitle="Connectez-vous pour déposer un dossier, suivre une candidature ou instruire une offre."
      headerRight={
        <Link to="/register" className="btn-primary text-sm py-2 px-4 hidden sm:inline-flex">
          S'inscrire
        </Link>
      }
    >
      <div className="mb-6 lg:hidden">
        <p className="home-kicker mb-2">Espace sécurisé</p>
        <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
      </div>
      <h2 className="hidden lg:block text-xl font-bold text-slate-900 mb-1">Connexion</h2>
      <p className="hidden lg:block text-sm text-slate-500 mb-6">Accédez à votre espace selon votre rôle.</p>

      <div className="auth-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
            >
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-slate-600 text-sm font-medium">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              placeholder="vous@recrute.td"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-slate-600 text-sm font-medium">Mot de passe</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field pr-11"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><LogIn size={16} />Se connecter</>
            )}
          </motion.button>
          <p className="text-center mt-4">
            <Link to="/forgot-password" className="text-sm font-semibold text-blue-800 hover:text-blue-600">
              Mot de passe oublié ?
            </Link>
            <span className="text-slate-300 mx-2">·</span>
            <Link to="/login-otp" className="text-sm font-semibold text-blue-800 hover:text-blue-600">
              Connexion par code
            </Link>
          </p>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider text-center mb-3">
            Comptes de démonstration
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(({ label, email: demoEmail }) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => { setEmail(demoEmail); setPassword('password'); setError(''); }}
                className="bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-100 rounded-lg px-2.5 py-2 text-center transition-all"
              >
                <p className="text-slate-700 text-xs font-medium">{label}</p>
                <p className="text-slate-400 text-[10px] truncate">{demoEmail.split('@')[0]}</p>
              </button>
            ))}
          </div>
          <p className="text-center mt-4">
            <Link to="/forgot-password" className="text-sm font-semibold text-blue-800 hover:text-blue-600">
              Mot de passe oublié ?
            </Link>
            <span className="text-slate-300 mx-2">·</span>
            <Link to="/login-otp" className="text-sm font-semibold text-blue-800 hover:text-blue-600">
              Connexion par code
            </Link>
          </p>
          <p className="text-center text-slate-500 text-sm mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-blue-800 hover:text-blue-600 font-semibold">
              Créer un compte candidat
            </Link>
          </p>
        </div>
      </div>
      <p className="text-center text-slate-400 text-xs mt-6">© 2026 Portail Concours et Recrutements Tchad — PFE</p>
    </AuthShell>
  );
};

export default LoginPage;
