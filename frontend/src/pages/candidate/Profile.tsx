import { Mail, Phone, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';

export default function CandidateProfile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        kicker="Compte"
        title="Mon profil"
        subtitle="Informations personnelles liées à votre compte candidat."
      />

      <div className="glass-card p-8">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-200">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-4xl font-bold text-white shadow-soft">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{user?.first_name} {user?.last_name}</h3>
            <p className="text-slate-500">Candidat</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-slate-800">Informations de contact</h4>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Adresse email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Numéro de téléphone</p>
                  <p className="font-medium">{user?.phone || 'Non renseigné'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-slate-800">Informations d'identité</h4>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Numéro National d'Identité (NNI)</p>
                  <p className="font-medium font-mono tracking-widest">{user?.nin || 'Non renseigné'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
