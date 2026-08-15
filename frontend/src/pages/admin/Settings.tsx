import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { settingsApi } from '../../api';
import { notify } from '../../lib/feedback';
import PageHeader from '../../components/ui/PageHeader';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platform_name: '',
    platform_subtitle: '',
    contact_email: '',
    contact_phone: '',
    support_message: '',
    registration_enabled: true,
    payment_mock_enabled: true,
  });

  useEffect(() => {
    settingsApi.get()
      .then((res) => {
        const d = res.data.data || {};
        setForm({
          platform_name: d.platform_name || '',
          platform_subtitle: d.platform_subtitle || '',
          contact_email: d.contact_email || '',
          contact_phone: d.contact_phone || '',
          support_message: d.support_message || '',
          registration_enabled: d.registration_enabled === '1' || d.registration_enabled === true,
          payment_mock_enabled: d.payment_mock_enabled === '1' || d.payment_mock_enabled === true,
        });
      })
      .catch((err) => notify.error(err, 'Impossible de charger les paramètres.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update(form);
      notify.success('Paramètres enregistrés');
    } catch (err) {
      notify.error(err, 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-slate-500 text-center py-16">Chargement des paramètres...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        kicker="SuperAdmin"
        title="Paramètres de la plateforme"
        subtitle="Identité, contacts et options de démonstration."
      />

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-slate-600">Nom de la plateforme</label>
            <input
              className="input-field"
              value={form.platform_name}
              onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-slate-600">Sous-titre</label>
            <input
              className="input-field"
              value={form.platform_subtitle}
              onChange={(e) => setForm({ ...form, platform_subtitle: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600">E-mail de contact</label>
            <input
              type="email"
              className="input-field"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600">Téléphone</label>
            <input
              className="input-field"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-slate-600">Message d'assistance</label>
            <textarea
              rows={3}
              className="input-field resize-none"
              value={form.support_message}
              onChange={(e) => setForm({ ...form, support_message: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-200">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1 rounded border-slate-300"
              checked={form.registration_enabled}
              onChange={(e) => setForm({ ...form, registration_enabled: e.target.checked })}
            />
            <span>
              <span className="font-medium">Inscriptions ouvertes</span>
              <span className="block text-slate-500">Les candidats peuvent créer un compte depuis la page publique.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1 rounded border-slate-300"
              checked={form.payment_mock_enabled}
              onChange={(e) => setForm({ ...form, payment_mock_enabled: e.target.checked })}
            />
            <span>
              <span className="font-medium">Paiement simulé (Mobile Money mock)</span>
              <span className="block text-slate-500">À désactiver lorsque l'opérateur Airtel / Moov sera branché.</span>
            </span>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            <Save size={16} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
