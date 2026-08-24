import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, Briefcase, Users, Building2, TrendingUp,
  ShieldCheck, Menu, X, ArrowRight, FileText,
  Bell, CheckCircle, Phone, Mail, Clock, ChevronRight, LogIn, Lock
} from 'lucide-react';
import { competitionsApi, jobOffersApi, publicApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Competition, JobOffer } from '../../types';
import { notify } from '../../lib/feedback';

const SERVICES = [
  { icon: FileText, title: 'Dépôt en ligne', desc: 'Soumettez votre dossier (CV, diplômes, pièces) depuis un ordinateur ou un téléphone.' },
  { icon: Briefcase, title: 'Concours et offres', desc: 'Consultez les concours et postes de recrutement publiés sur le portail.' },
  { icon: Bell, title: 'Convocations', desc: 'Téléchargez votre convocation PDF avec QR de vérification depuis votre espace.' },
  { icon: ShieldCheck, title: 'Anonymat du jury', desc: 'Le jury ne voit que le numéro d’anonymat. Les notes sont scellées par un cachet HMAC.' },
  { icon: CheckCircle, title: 'Suivi du dossier', desc: 'Consultez le statut à chaque étape : soumis, en instruction, accepté, évalué.' },
] as const;

const PROVINCES = ['N\'Djaména', 'Moundou', 'Abéché', 'Sarh', 'Faya'];

const DEFAULT_SETTINGS = {
  platform_name: 'Portail Concours et Recrutements Tchad',
  platform_subtitle: 'Plateforme web et mobile pour la gestion des concours et des recrutements au Tchad',
  contact_email: 'contact@recrute.td',
  contact_phone: '+235 22 51 00 00',
  support_message: 'Pour toute assistance, contactez la Direction des concours.',
  registration_enabled: true,
};

function formatStat(value: number | string) {
  if (value === '...' || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('fr-FR') : String(value);
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedLocation, setAppliedLocation] = useState('');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [stats, setStats] = useState({ active_competitions: 0, total_candidates: 0, departments_count: 0, total_jobs: 0 });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const canRegister = settings.registration_enabled && !isAuthenticated;
  const applyTarget = isAuthenticated
    ? (user?.roles?.some(r => r.toLowerCase() === 'candidat') ? '/candidate/offers' : '/admin')
    : (settings.registration_enabled ? '/register' : '/login');

  useEffect(() => {
    publicApi.getSettings()
      .then((res) => setSettings({ ...DEFAULT_SETTINGS, ...(res.data.data || {}) }))
      .catch(() => { /* défauts institutionnels */ });
  }, []);

  useEffect(() => {
    fetchPublicLists(appliedSearch, appliedLocation);
  }, [appliedSearch, appliedLocation]);

  const fetchPublicLists = async (q: string, loc: string) => {
    setLoading(true);
    try {
      const [compRes, offerRes, statsRes] = await Promise.all([
        competitionsApi.list({ search: q || undefined, per_page: 6, sort_by: 'end_date', sort_order: 'asc' }),
        jobOffersApi.list({ search: q || undefined, location: loc || undefined, per_page: 6 }),
        publicApi.getStats(),
      ]);
      setCompetitions(compRes.data.data || []);
      setOffers(offerRes.data.data || []);
      setStats(statsRes.data.data || stats);
    } catch (err) {
      console.error('Failed to fetch home data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setAppliedSearch(search.trim());
    setAppliedLocation(location);
    document.getElementById('offres')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGoToDashboard = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const roles: string[] = user?.roles || [];
    if (roles.some(r => r.toLowerCase() === 'candidat')) navigate('/candidate');
    else navigate('/admin');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="home-page min-h-screen flex flex-col"
    >
      <div className="home-header-wrap">
      <div className="home-flag" />

      <header id="top" className="home-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center shadow-md shadow-blue-900/20">
              <span className="text-white font-bold text-[11px] tracking-tight">eCR</span>
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-900 leading-none tracking-tight">
                e-CR <span className="text-blue-700">Tchad</span>
              </p>
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-[0.16em] mt-1">Portail concours & recrutements</p>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-semibold text-slate-600">
            <a href="#top" className="hover:text-blue-700 transition-colors">Accueil</a>
            <a href="#offres" className="hover:text-blue-700 transition-colors">Concours</a>
            <a href="#services" className="hover:text-blue-700 transition-colors">Services</a>
            <a href="#contact" className="hover:text-blue-700 transition-colors">Contact</a>
          </nav>
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <button onClick={handleGoToDashboard} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                <LogIn size={15}/> Mon espace
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-800 px-3 py-2">Connexion</Link>
                {canRegister && (
                  <Link to="/register" className="btn-primary text-sm py-2 px-4">S'inscrire</Link>
                )}
              </>
            )}
          </div>
          <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-1 shadow-lg">
            <a href="#offres" className="font-semibold text-slate-700 p-3 rounded-lg hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Concours</a>
            <a href="#services" className="font-semibold text-slate-700 p-3 rounded-lg hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Services</a>
            <a href="#contact" className="font-semibold text-slate-700 p-3 rounded-lg hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Contact</a>
            {isAuthenticated ? (
              <button onClick={() => { setMobileOpen(false); handleGoToDashboard(); }} className="btn-primary mt-2 justify-center">Mon espace</button>
            ) : (
              <div className="flex gap-2 mt-2">
                <Link to="/login" className="flex-1 text-center font-semibold text-blue-800 border border-blue-200 py-2.5 rounded-xl">Connexion</Link>
                {canRegister && <Link to="/register" className="flex-1 text-center btn-primary">S'inscrire</Link>}
              </div>
            )}
          </div>
        )}
      </header>
      </div>

      <main className="flex-1">
        <section className="home-hero">
          <div className="hero-mesh" />
          <div className="hero-grid" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="home-kicker mb-5 inline-flex items-center gap-2"
            >
              <span className="w-8 h-px bg-accent-500" />
              Portail public — concours et recrutements
              <span className="w-8 h-px bg-accent-500" />
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-4xl md:text-[56px] font-bold text-white tracking-tight leading-[1.12] mb-5"
            >
              Concours et recrutements,<br className="hidden md:block" />
              <span className="text-accent-400">un portail web et mobile</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.16 }}
              className="max-w-2xl mx-auto text-base md:text-lg text-blue-100/85 mb-10 leading-relaxed"
            >
              {settings.platform_subtitle}. Concours publiés, dossiers suivis, convocations vérifiables.
            </motion.p>
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              onSubmit={handleSearch}
              className="home-search max-w-3xl mx-auto flex flex-col md:flex-row gap-2"
            >
              <div className="flex-1 flex items-center gap-3 px-4 py-2.5">
                <Search className="text-slate-400 flex-shrink-0" size={18}/>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Concours, offre ou organisation…"
                  className="w-full text-slate-800 outline-none placeholder-slate-400 bg-transparent text-sm"
                />
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 md:w-52 md:border-l border-slate-100">
                <MapPin className="text-slate-400 flex-shrink-0" size={18}/>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full text-slate-700 outline-none bg-transparent cursor-pointer text-sm font-medium"
                >
                  <option value="">Localité</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-blue-800 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm m-1">
                Rechercher <ArrowRight size={16}/>
              </button>
            </motion.form>
          </div>
        </section>

        <section className="relative z-10 -mt-10 pb-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Briefcase, val: loading ? '...' : stats.active_competitions, label: 'Concours ouverts' },
              { icon: Users, val: loading ? '...' : stats.total_candidates, label: 'Candidats inscrits' },
              { icon: Building2, val: loading ? '...' : stats.departments_count, label: 'Organisations' },
              { icon: TrendingUp, val: loading ? '...' : stats.total_jobs, label: 'Postes à pourvoir' },
            ].map(({ icon: Icon, val, label }) => (
              <div key={label} className="home-stat">
                <Icon size={18} className="mx-auto mb-2 text-blue-700" />
                <div className="text-2xl md:text-3xl font-bold text-slate-900 tabular-nums">{formatStat(val)}</div>
                <div className="text-slate-500 text-xs font-medium mt-1">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: 'Copies anonymes', text: 'Le jury n’accède qu’au numéro d’anonymat, jamais à l’identité.' },
              { icon: ShieldCheck, title: 'Notes scellées', text: 'Chaque note est horodatée et protégée par un cachet HMAC.' },
              { icon: Users, title: 'Rôles séparés', text: 'Instruction, jury et recrutement : des accès distincts et tracés.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/60">
                <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-blue-800 flex items-center justify-center shrink-0 shadow-sm">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{title}</p>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="offres" className="py-16 bg-slate-50 scroll-mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <p className="home-kicker mb-2">Offres publiées</p>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Concours ouverts</h2>
                <p className="text-slate-500 mt-2 text-sm">Seuls les concours publiés apparaissent ici.</p>
              </div>
              <Link to={applyTarget} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-600">
                {isAuthenticated ? 'Voir les offres' : 'Créer un compte pour postuler'} <ChevronRight size={16}/>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="competition-card animate-pulse">
                    <div className="h-4 bg-slate-200 rounded mb-4 w-1/3"/>
                    <div className="h-6 bg-slate-200 rounded mb-3"/>
                    <div className="h-4 bg-slate-100 rounded w-2/3"/>
                  </div>
                ))}
              </div>
            ) : competitions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <Briefcase size={36} className="mx-auto mb-3 text-slate-300"/>
                <p className="font-semibold text-slate-600">Aucun concours ouvert{appliedSearch ? ` pour « ${appliedSearch} »` : ''}</p>
                <p className="text-sm text-slate-400 mt-1">Publiez un concours depuis l’espace administration pour l’afficher.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {competitions.map(c => (
                  <div key={c.id} className="competition-card flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800">
                        {c.status_label || 'Publié'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 text-xs">
                        <Clock size={12}/> {c.registration_close_date || c.end_date ? new Date(c.registration_close_date || c.end_date).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-[15px] leading-snug mb-1">{c.title}</h3>
                    <p className="text-[11px] font-mono text-slate-400 mb-4">{c.reference}</p>
                    <div className="space-y-1.5 mb-5 text-sm text-slate-500 flex-1">
                      <div className="flex items-center gap-2"><Building2 size={14} className="text-blue-700"/>{c.department_name || 'Organisation'}</div>
                      <div className="flex items-center gap-2"><Users size={14} className="text-blue-700"/>{c.quota} places</div>
                    </div>
                    <Link
                      to={applyTarget}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-800 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
                    >
                      Postuler <ArrowRight size={14}/>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-5">Postes ouverts</h3>
              {loading ? null : offers.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500 text-sm">
                  Aucun poste publié{appliedLocation ? ` à ${appliedLocation}` : ''}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {offers.map(o => (
                    <div key={o.id} className="competition-card">
                      <h4 className="font-bold text-slate-900 mb-3 text-[15px]">{o.title}</h4>
                      <div className="space-y-1.5 text-sm text-slate-500 mb-4">
                        <div className="flex items-center gap-2"><Briefcase size={14} className="text-blue-700"/>{o.competition_title || 'Concours'}</div>
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-blue-700"/>{o.location || 'Non précisé'}</div>
                        <div className="flex items-center gap-2"><Users size={14} className="text-blue-700"/>{o.positions_count} poste(s)</div>
                      </div>
                      <Link to={applyTarget} className="text-sm font-semibold text-blue-800 hover:text-blue-600 inline-flex items-center gap-1">
                        Voir et postuler <ArrowRight size={14}/>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="services" className="py-20 bg-white scroll-mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="home-kicker mb-2">Parcours candidat</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Services de la plateforme</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SERVICES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-4">
                    <Icon size={20}/>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 text-sm">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 text-white" style={{ background: 'linear-gradient(160deg, #0a1d33 0%, #12355e 55%, #0e2948 100%)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <p className="home-kicker mb-3">Mode d'emploi</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Comment ça marche ?</h2>
            <p className="text-blue-100/70 mb-12 text-sm">Trois étapes pour déposer une candidature</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                { step: '01', title: 'Créez votre compte', desc: 'Inscription avec e-mail, nom et NNI. Un seul compte par candidat.' },
                { step: '02', title: 'Déposez votre dossier', desc: 'Choisissez un poste ouvert, joignez les pièces, suivez le statut.' },
                { step: '03', title: 'Passez les épreuves', desc: 'Numéro d’anonymat et convocation PDF si votre dossier est accepté.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-accent-400 font-bold text-sm mb-3">{step}</div>
                  <h3 className="text-lg font-bold mb-2">{title}</h3>
                  <p className="text-blue-100/70 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <Link
              to={isAuthenticated ? '/candidate' : (settings.registration_enabled ? '/register' : '/login')}
              className="inline-flex items-center gap-2 mt-12 bg-white text-blue-900 hover:bg-blue-50 font-bold px-7 py-3.5 rounded-xl transition-colors text-sm"
            >
              {isAuthenticated ? 'Accéder à mon espace' : 'Commencer maintenant'} <ArrowRight size={16}/>
            </Link>
          </div>
        </section>

        <section id="contact" className="py-20 bg-slate-50 scroll-mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2">
              <p className="home-kicker mb-2">Assistance</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Besoin d'aide ?</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">{settings.support_message}</p>
              <div className="space-y-4">
                {[
                  { icon: Phone, title: 'Téléphone', info: settings.contact_phone, sub: 'Lun–Ven 8h–17h' },
                  { icon: Mail, title: 'Email', info: settings.contact_email, sub: 'Réponse sous 48h' },
                  { icon: MapPin, title: 'Adresse', info: 'N’Djaména', sub: 'République du Tchad' },
                ].map(({ icon: Icon, title, info, sub }) => (
                  <div key={title} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-blue-800 flex items-center justify-center shrink-0">
                      <Icon size={16}/>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</p>
                      <p className="text-sm font-semibold text-slate-800">{info}</p>
                      <p className="text-xs text-slate-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-5">Envoyer un message</h3>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); notify.success('Message reçu', `Nous vous répondrons à ${settings.contact_email}.`); (e.target as HTMLFormElement).reset(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="first_name" type="text" placeholder="Prénom *" required className="input-field text-sm"/>
                  <input name="last_name" type="text" placeholder="Nom *" required className="input-field text-sm"/>
                </div>
                <input name="email" type="email" placeholder="Adresse email *" required className="input-field text-sm"/>
                <select name="subject" required className="input-field text-sm text-slate-600">
                  <option value="">Sujet *</option>
                  <option>Question sur un concours</option>
                  <option>Problème technique</option>
                  <option>Mon dossier de candidature</option>
                  <option>Autre</option>
                </select>
                <textarea name="message" required rows={4} placeholder="Décrivez votre demande…" className="input-field text-sm resize-none"/>
                <button type="submit" className="btn-primary w-full justify-center">
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-blue-900 text-blue-100/70 text-sm">
        <div className="h-px bg-gradient-to-r from-transparent via-accent-500/80 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white text-[10px] font-bold">eCR</div>
              <span className="text-white font-semibold">e-CR Tchad</span>
            </div>
            <p className="mb-4 max-w-sm leading-relaxed text-[13px]">{settings.platform_subtitle}</p>
            <p className="text-[13px]">{settings.contact_email} · {settings.contact_phone}</p>
            <p className="text-[13px] mt-1">N'Djaména, République du Tchad</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Candidats</h4>
            <ul className="space-y-2 text-[13px]">
              {settings.registration_enabled && <li><Link to="/register" className="hover:text-white">Créer un compte</Link></li>}
              <li><Link to="/verify-convocation" className="hover:text-white">Vérifier une convocation</Link></li>
              <li><Link to="/login" className="hover:text-white">Se connecter</Link></li>
              <li><a href="#offres" className="hover:text-white">Consulter les concours</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Informations</h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#services" className="hover:text-white">Nos services</a></li>
              <li><a href="#contact" className="hover:text-white">Aide & contact</a></li>
              <li><Link to="/login" className="hover:text-white">Espace administration</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-[12px]">
            <p>© 2026 Portail Concours et Recrutements Tchad — démonstration PFE.</p>
            <div className="flex gap-1" aria-label="Drapeau du Tchad">
              <div className="w-6 h-4 bg-blue-800 rounded-[1px]"/>
              <div className="w-6 h-4 bg-accent-500 rounded-[1px]"/>
              <div className="w-6 h-4 bg-red-600 rounded-[1px]"/>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
