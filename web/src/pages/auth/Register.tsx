import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, AlertCircle, Ban } from 'lucide-react';
import { authApi, publicApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import AuthShell from '../../components/public/AuthShell';
import { dashboardPath } from '../../lib/dashboardPath';

const RegisterPage: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    nin: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  useEffect(() => {
    publicApi.getSettings()
      .then((res) => {
        if (res.data.data?.registration_enabled === false) setRegistrationEnabled(false);
      })
      .catch(() => { /* inscription ouverte par défaut */ });
  }, []);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={dashboardPath(user?.roles)} replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register(formData);
      const { user: u, access_token: t, refresh_token: rt } = (res.data.data as any);

      localStorage.setItem('auth_token', t);
      if (rt) localStorage.setItem('refresh_token', rt);
      localStorage.setItem('auth_user', JSON.stringify(u));

      window.location.href = '/candidate';
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors).flat().join(' | ');
        setError(validationErrors || err.response?.data?.message || 'Erreur de validation.');
      } else {
        setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      wide
      kicker="Candidats"
      title="Créez votre compte en quelques minutes"
      subtitle="Un seul compte par personne. Vous pourrez ensuite postuler aux concours et postes publiés."
      headerRight={
        <Link to="/login" className="btn-primary text-sm py-2 px-4 hidden sm:inline-flex">
          Connexion
        </Link>
      }
    >
      <div className="mb-6">
        <p className="home-kicker mb-2 lg:hidden">Inscription</p>
        <h2 className="text-xl font-bold text-slate-900">Créer un compte candidat</h2>
        <p className="text-sm text-slate-500 mt-1">Les champs marqués * sont obligatoires.</p>
      </div>

      {!registrationEnabled ? (
        <div className="auth-card text-center py-10">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <Ban size={22} />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Inscription temporairement fermée</h3>
          <p className="text-sm text-slate-500 mb-6">Les nouvelles inscriptions ne sont pas ouvertes pour le moment.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/" className="btn-primary text-sm py-2.5 px-4">Retour à l'accueil</Link>
            <Link to="/login" className="btn-ghost text-sm py-2.5 px-4">J'ai déjà un compte</Link>
          </div>
        </div>
      ) : (
        <div className="auth-card">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="first_name" className="text-slate-600 text-sm font-medium">Prénom *</label>
                <input id="first_name" type="text" value={formData.first_name} onChange={handleChange}
                  className="input-field" placeholder="Prénom" autoComplete="given-name" required />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="last_name" className="text-slate-600 text-sm font-medium">Nom *</label>
                <input id="last_name" type="text" value={formData.last_name} onChange={handleChange}
                  className="input-field" placeholder="Nom" autoComplete="family-name" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-slate-600 text-sm font-medium">Adresse e-mail *</label>
              <input id="email" type="email" value={formData.email} onChange={handleChange}
                className="input-field" placeholder="email@exemple.td" autoComplete="email" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="nin" className="text-slate-600 text-sm font-medium">NNI</label>
                <input id="nin" type="text" value={formData.nin} onChange={handleChange}
                  className="input-field" placeholder="Numéro national" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-slate-600 text-sm font-medium">Téléphone</label>
                <input id="phone" type="tel" value={formData.phone} onChange={handleChange}
                  className="input-field" placeholder="+235…" autoComplete="tel" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-slate-600 text-sm font-medium">Mot de passe *</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={formData.password}
                    onChange={handleChange}
                    className="input-field pr-11" placeholder="••••••••" autoComplete="new-password" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password_confirmation" className="text-slate-600 text-sm font-medium">Confirmer *</label>
                <div className="relative">
                  <input id="password_confirmation" type={showConfirmPassword ? 'text' : 'password'} value={formData.password_confirmation}
                    onChange={handleChange}
                    className="input-field pr-11" placeholder="••••••••" autoComplete="new-password" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (<><UserPlus size={16} />Créer mon compte</>)}
            </motion.button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6 pt-5 border-t border-slate-100">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="text-blue-800 hover:text-blue-600 font-semibold">
              Se connecter
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
};

export default RegisterPage;
