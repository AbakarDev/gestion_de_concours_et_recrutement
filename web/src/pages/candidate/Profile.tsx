import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Download, GraduationCap, Briefcase, User, Loader2, Plus, Trash2, Camera } from 'lucide-react';
import { dossierApi } from '../../api';
import type { DossierPayload } from '../../types';
import { notify } from '../../lib/feedback';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import PageHeader from '../../components/ui/PageHeader';

const SITUATIONS = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'veuf', label: 'Veuf / Veuve' },
  { value: 'divorce', label: 'Divorcé(e)' },
];

const NIVEAUX_LANGUE = [
  { value: 'scolaire', label: 'Scolaire' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'courant', label: 'Courant' },
];

type Tab = 'civil' | 'cursus' | 'experience' | 'cv';

export default function CandidateProfile() {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>('civil');
  const [dossier, setDossier] = useState<DossierPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [photoNonce, setPhotoNonce] = useState(0);
  const [civil, setCivil] = useState({
    date_naissance: '',
    lieu_naissance: '',
    nationalite: 'Tchadienne',
    situation_familiale: '',
    sexe: '',
    adresse: '',
    phone: '',
    langues: [{ langue: 'Français', niveau: 'courant' }] as Array<{ langue: string; niveau: string }>,
  });
  const [diplomaForm, setDiplomaForm] = useState({
    type_diplome: 'Licence',
    etablissement: '',
    specialite: '',
    annee: new Date().getFullYear().toString(),
    file: null as File | null,
  });
  const [xpForm, setXpForm] = useState({
    poste: '',
    employeur: '',
    date_debut: '',
    date_fin: '',
    description: '',
    current: false,
  });

  const load = async () => {
    setLoadError(null);
    try {
      const res = await dossierApi.get();
      const data = res.data.data;
      setDossier(data);
      setCivil({
        date_naissance: data.profile.date_naissance || '',
        lieu_naissance: data.profile.lieu_naissance || '',
        nationalite: data.profile.nationalite || 'Tchadienne',
        situation_familiale: data.profile.situation_familiale || '',
        sexe: data.profile.sexe || '',
        adresse: data.profile.adresse || '',
        phone: data.profile.phone || '',
        langues: data.profile.langues?.length ? data.profile.langues : [{ langue: 'Français', niveau: 'courant' }],
      });
    } catch (err) {
      setLoadError('Impossible de charger le dossier administratif.');
      notify.error(err, 'Impossible de charger le dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!dossier?.profile.has_photo && !dossier?.profile.photo_url) {
      setPhotoSrc(null);
      return;
    }
    let alive = true;
    let blobUrl: string | null = null;
    dossierApi.viewPhoto()
      .then((url) => {
        if (!alive) {
          URL.revokeObjectURL(url);
          return;
        }
        blobUrl = url;
        setPhotoSrc(url);
      })
      .catch(() => {
        if (alive) setPhotoSrc(null);
      });
    return () => {
      alive = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [dossier?.profile.has_photo, photoNonce]);

  const saveCivil = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await dossierApi.update({
        ...civil,
        langues: civil.langues.filter(l => l.langue.trim()),
      });
      setDossier(res.data.data);
      notify.success('État civil enregistré');
    } catch (err) {
      notify.error(err, 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (file.type && !allowed.includes(file.type)) {
      notify.warning('Format refusé', 'Utilisez une photo JPG ou PNG (pas HEIC/WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify.warning('Fichier trop lourd', 'La photo d’identité est limitée à 5 Mo.');
      return;
    }
    try {
      const preview = URL.createObjectURL(file);
      setPhotoSrc(preview);
      const res = await dossierApi.uploadPhoto(file);
      setDossier(res.data.data);
      setPhotoNonce(n => n + 1);
      notify.success('Photo d’identité enregistrée');
    } catch (err) {
      notify.error(err, 'Photo refusée. JPG ou PNG, 5 Mo max.');
    }
  };

  const addDiploma = async (e: FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append('type_diplome', diplomaForm.type_diplome);
    form.append('etablissement', diplomaForm.etablissement);
    form.append('annee', diplomaForm.annee);
    if (diplomaForm.specialite) form.append('specialite', diplomaForm.specialite);
    if (diplomaForm.file) form.append('file', diplomaForm.file);
    try {
      await dossierApi.addDiploma(form);
      notify.success('Diplôme ajouté au cursus');
      setDiplomaForm({ ...diplomaForm, etablissement: '', specialite: '', file: null });
      await load();
    } catch (err) {
      notify.error(err, 'Impossible d’ajouter le diplôme.');
    }
  };

  const removeDiploma = async (id: number) => {
    const ok = await confirm({ title: 'Retirer ce diplôme ?', confirmLabel: 'Retirer', variant: 'danger' });
    if (!ok) return;
    await dossierApi.deleteDiploma(id);
    notify.success('Diplôme retiré');
    load();
  };

  const addExperience = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await dossierApi.addExperience({
        poste: xpForm.poste,
        employeur: xpForm.employeur,
        date_debut: xpForm.date_debut,
        date_fin: xpForm.current ? null : xpForm.date_fin || null,
        description: xpForm.description || null,
      });
      notify.success('Expérience ajoutée');
      setXpForm({ poste: '', employeur: '', date_debut: '', date_fin: '', description: '', current: false });
      await load();
    } catch (err) {
      notify.error(err, 'Impossible d’ajouter l’expérience.');
    }
  };

  const removeXp = async (id: number) => {
    const ok = await confirm({ title: 'Retirer cette expérience ?', confirmLabel: 'Retirer', variant: 'danger' });
    if (!ok) return;
    await dossierApi.deleteExperience(id);
    notify.success('Expérience retirée');
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
        <Loader2 className="animate-spin text-blue-700" /> Chargement du dossier…
      </div>
    );
  }

  if (loadError || !dossier) {
    return (
      <div className="max-w-lg mx-auto glass-card p-8 text-center space-y-3">
        <p className="text-red-700 font-semibold">{loadError || 'Dossier indisponible.'}</p>
        <button type="button" className="btn-primary" onClick={() => { setLoading(true); load(); }}>
          Réessayer
        </button>
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof User }> = [
    { id: 'civil', label: 'État civil', icon: User },
    { id: 'cursus', label: 'Cursus', icon: GraduationCap },
    { id: 'experience', label: 'Expérience', icon: Briefcase },
    { id: 'cv', label: 'CV officiel', icon: Download },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        kicker="Dossier administratif"
        title="Mon dossier de candidature"
        subtitle="Renseignez votre état civil et votre cursus. Le CV officiel est généré par la plateforme, au gabarit unique du portail."
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 border transition-colors ${
              tab === id
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'civil' && (
        <form onSubmit={saveCivil} className="glass-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <label className="shrink-0 cursor-pointer text-center">
              <div className="w-28 h-36 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center mx-auto">
                {photoSrc ? (
                  <img src={photoSrc} alt="Photo d’identité" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400 text-xs px-2">
                    <Camera className="mx-auto mb-1" size={20} />
                    Photo d’identité
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) onPhoto(file);
                }}
              />
              <span className="text-xs text-blue-800 font-semibold mt-2 block">Téléverser la photo</span>
            </label>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReadOnly label="Nom" value={dossier.profile.last_name} />
              <ReadOnly label="Prénom(s)" value={dossier.profile.first_name} />
              <ReadOnly label="NNI" value={dossier.profile.nin || '—'} />
              <ReadOnly label="Courriel" value={dossier.profile.email} />
              <Field label="Téléphone">
                <input className="input-field" value={civil.phone} onChange={e => setCivil({ ...civil, phone: e.target.value })} />
              </Field>
              <Field label="Date de naissance" required>
                <input type="date" className="input-field" value={civil.date_naissance} onChange={e => setCivil({ ...civil, date_naissance: e.target.value })} />
              </Field>
              <Field label="Lieu de naissance">
                <input className="input-field" value={civil.lieu_naissance} onChange={e => setCivil({ ...civil, lieu_naissance: e.target.value })} />
              </Field>
              <Field label="Nationalité">
                <input className="input-field" value={civil.nationalite} onChange={e => setCivil({ ...civil, nationalite: e.target.value })} />
              </Field>
              <Field label="Sexe" required>
                <select className="input-field" value={civil.sexe} onChange={e => setCivil({ ...civil, sexe: e.target.value })}>
                  <option value="">Sélectionner</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </Field>
              <Field label="Situation de famille">
                <select className="input-field" value={civil.situation_familiale} onChange={e => setCivil({ ...civil, situation_familiale: e.target.value })}>
                  <option value="">Sélectionner</option>
                  {SITUATIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Adresse de résidence" required>
                  <input className="input-field" value={civil.adresse} onChange={e => setCivil({ ...civil, adresse: e.target.value })} />
                </Field>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2">Langues</p>
            <div className="space-y-2">
              {civil.langues.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input-field" placeholder="Langue" value={row.langue} onChange={e => {
                    const next = [...civil.langues];
                    next[i] = { ...row, langue: e.target.value };
                    setCivil({ ...civil, langues: next });
                  }} />
                  <select className="input-field max-w-[180px]" value={row.niveau} onChange={e => {
                    const next = [...civil.langues];
                    next[i] = { ...row, niveau: e.target.value };
                    setCivil({ ...civil, langues: next });
                  }}>
                    {NIVEAUX_LANGUE.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
              ))}
              <button type="button" className="text-sm text-blue-800 font-semibold" onClick={() => setCivil({ ...civil, langues: [...civil.langues, { langue: '', niveau: 'scolaire' }] })}>
                + Ajouter une langue
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer l’état civil'}
          </button>
        </form>
      )}

      {tab === 'cursus' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <form onSubmit={addDiploma} className="lg:col-span-2 glass-card p-5 space-y-3">
            <h3 className="font-semibold text-slate-800">Ajouter un diplôme</h3>
            <select className="input-field" value={diplomaForm.type_diplome} onChange={e => setDiplomaForm({ ...diplomaForm, type_diplome: e.target.value })}>
              {(dossier.diploma_levels || []).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <input className="input-field" required placeholder="Établissement" value={diplomaForm.etablissement} onChange={e => setDiplomaForm({ ...diplomaForm, etablissement: e.target.value })} />
            <input className="input-field" placeholder="Spécialité" value={diplomaForm.specialite} onChange={e => setDiplomaForm({ ...diplomaForm, specialite: e.target.value })} />
            <input className="input-field" required type="number" min={1950} placeholder="Année" value={diplomaForm.annee} onChange={e => setDiplomaForm({ ...diplomaForm, annee: e.target.value })} />
            <input className="input-field" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDiplomaForm({ ...diplomaForm, file: e.target.files?.[0] || null })} />
            <p className="text-xs text-slate-400">Joignez la copie scannée du diplôme (PDF ou image).</p>
            <button type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-2"><Plus size={16} /> Ajouter</button>
          </form>
          <div className="lg:col-span-3 glass-card p-5 space-y-3">
            {dossier.diplomas.length === 0 && <p className="text-sm text-slate-500">Aucun diplôme déclaré.</p>}
            {dossier.diplomas.map(d => (
              <div key={d.id} className="flex justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-800">{d.type_diplome || d.niveau}{d.specialite ? ` — ${d.specialite}` : ''}</p>
                  <p className="text-xs text-slate-500">{d.etablissement} · {d.annee}</p>
                  <p className="text-xs mt-1">{d.document_id ? 'Copie jointe' : 'Copie manquante'}</p>
                </div>
                <button type="button" onClick={() => removeDiploma(d.id)} className="text-red-600 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'experience' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <form onSubmit={addExperience} className="lg:col-span-2 glass-card p-5 space-y-3">
            <h3 className="font-semibold text-slate-800">Ajouter une expérience</h3>
            <input className="input-field" required placeholder="Poste occupé" value={xpForm.poste} onChange={e => setXpForm({ ...xpForm, poste: e.target.value })} />
            <input className="input-field" required placeholder="Employeur / administration" value={xpForm.employeur} onChange={e => setXpForm({ ...xpForm, employeur: e.target.value })} />
            <input className="input-field" required type="date" value={xpForm.date_debut} onChange={e => setXpForm({ ...xpForm, date_debut: e.target.value })} />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={xpForm.current} onChange={e => setXpForm({ ...xpForm, current: e.target.checked })} />
              Poste actuel
            </label>
            {!xpForm.current && <input className="input-field" type="date" value={xpForm.date_fin} onChange={e => setXpForm({ ...xpForm, date_fin: e.target.value })} />}
            <textarea className="input-field" rows={3} placeholder="Missions (facultatif)" value={xpForm.description} onChange={e => setXpForm({ ...xpForm, description: e.target.value })} />
            <button type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-2"><Plus size={16} /> Ajouter</button>
          </form>
          <div className="lg:col-span-3 glass-card p-5 space-y-3">
            {dossier.experiences.length === 0 && <p className="text-sm text-slate-500">Aucune expérience déclarée (facultatif pour un jeune diplômé).</p>}
            {dossier.experiences.map(xp => (
              <div key={xp.id} className="flex justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-800">{xp.poste} — {xp.employeur}</p>
                  <p className="text-xs text-slate-500">{xp.date_debut} → {xp.date_fin || 'à ce jour'}</p>
                </div>
                <button type="button" onClick={() => removeXp(xp.id)} className="text-red-600 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cv' && (
        <div className="glass-card p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Le curriculum vitae n’est pas un fichier libre. Il est <strong>rédigé par le système</strong> à partir de votre état civil, de vos diplômes et de vos expériences, sur le gabarit unique de l’administration.
          </p>
          <p className="text-sm">
            {dossier.completeness.can_generate_cv
              ? 'Votre parcours est suffisant pour générer le CV officiel.'
              : 'Complétez la photo, l’état civil et au moins un diplôme (avec copie) avant de générer le CV.'}
          </p>
          <button
            type="button"
            disabled={!dossier.completeness.can_generate_cv}
            onClick={async () => {
              try {
                await dossierApi.downloadCv();
              } catch (err) {
                notify.error(err, 'Génération du CV impossible.');
              }
            }}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} /> Télécharger le CV administratif (PDF)
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 mb-1 block">{label}{required ? ' *' : ''}</span>
      {children}
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
