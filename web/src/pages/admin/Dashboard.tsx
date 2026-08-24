import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy, Building2, Briefcase, FileText, Clock
} from 'lucide-react';
import { competitionsApi, departmentsApi, jobOffersApi, applicationsApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';
import { rankingDossierLabel } from '../../lib/anonymat';

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ElementType;
  index: number;
}> = ({ label, value, icon: Icon, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06 }}
    className="app-stat"
  >
    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-3">
      <Icon size={18} />
    </div>
    <p className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</p>
    <p className="text-slate-500 text-sm font-medium mt-1">{label}</p>
  </motion.div>
);

const AdminDashboard: React.FC = () => {
  const { data: comps } = useQuery({ queryKey: ['competitions'], queryFn: () => competitionsApi.list().then(r => r.data.data) });
  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => departmentsApi.list().then(r => r.data.data) });
  const { data: jobs } = useQuery({ queryKey: ['job-offers'], queryFn: () => jobOffersApi.list().then(r => r.data.data) });
  const { data: apps } = useQuery({ queryKey: ['applications'], queryFn: () => applicationsApi.list().then(r => r.data.data) });

  const stats = [
    { label: 'Concours', value: comps?.length ?? 0, icon: Trophy, index: 0 },
    { label: 'Organisations', value: depts?.length ?? 0, icon: Building2, index: 1 },
    { label: 'Postes à pourvoir', value: jobs?.reduce((acc: number, j: any) => acc + j.positions_count, 0) ?? 0, icon: Briefcase, index: 2 },
    { label: 'Candidatures', value: apps?.length ?? 0, icon: FileText, index: 3 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Pilotage"
        title="Tableau de bord"
        subtitle="Vue d'ensemble réelle des concours, postes et dossiers."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
                <Trophy size={16} />
              </div>
              <h3 className="text-slate-800 font-semibold text-sm">Concours récents</h3>
            </div>
            <span className="text-slate-400 text-xs tabular-nums">{comps?.length ?? 0} au total</span>
          </div>
          {!comps || comps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <Trophy size={28} className="text-slate-300" />
              <p className="text-slate-400 text-sm">Aucun concours pour l'instant</p>
            </div>
          ) : (
            <table className="w-full data-table">
              <thead><tr><th>Titre</th><th>Référence</th><th>Statut</th></tr></thead>
              <tbody>
                {comps.slice(0, 5).map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="font-medium text-slate-800">{c.title}</td>
                    <td className="font-mono text-xs text-slate-500">{c.reference}</td>
                    <td>{c.status ? <StatusBadge status={c.status} /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <h3 className="text-slate-800 font-semibold text-sm">Candidatures récentes</h3>
            </div>
            <span className="text-slate-400 text-xs tabular-nums">{apps?.length ?? 0} au total</span>
          </div>
          {!apps || apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <FileText size={28} className="text-slate-300" />
              <p className="text-slate-400 text-sm">Aucune candidature pour l'instant</p>
            </div>
          ) : (
            <table className="w-full data-table">
              <thead><tr><th>N° Anonymat / Dossier</th><th>Statut</th><th>Date</th></tr></thead>
              <tbody>
                {apps.slice(0, 5).map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="font-mono text-xs text-slate-700">{rankingDossierLabel(a)}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={11} />
                        {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
              <Building2 size={16} />
            </div>
            <h3 className="text-slate-800 font-semibold text-sm">Organisations & départements</h3>
          </div>
        </div>
        {!depts || depts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Building2 size={28} className="text-slate-300" />
            <p className="text-slate-400 text-sm">Aucun département enregistré</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-5">
            {depts.map((d: any) => (
              <div key={d.id} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 hover:border-blue-200 transition-all">
                <p className="text-slate-800 text-sm font-medium truncate">{d.name}</p>
                <p className="text-slate-400 text-xs mt-0.5 font-mono">{d.code}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
