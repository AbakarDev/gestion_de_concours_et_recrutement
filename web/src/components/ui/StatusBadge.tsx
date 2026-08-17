import React from 'react';

type StatusKey =
  | 'draft' | 'published' | 'open' | 'evaluating' | 'closed' | 'archived'
  | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'evaluated' | 'admitted'
  | 'pending' | 'confirmed' | 'failed';

interface StatusConfig {
  label: string;
  dot: string;
  text: string;
  bg: string;
  border: string;
}

const STATUS_MAP: Record<StatusKey, StatusConfig> = {
  draft: {
    label: 'Brouillon',
    dot: 'bg-slate-400',
    text: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
  published: {
    label: 'Publié',
    dot: 'bg-emerald-600',
    text: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  open: {
    label: 'Ouvert',
    dot: 'bg-emerald-600',
    text: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  evaluating: {
    label: 'Évaluation',
    dot: 'bg-blue-600',
    text: 'text-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  closed: {
    label: 'Clôturé',
    dot: 'bg-amber-500',
    text: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  archived: {
    label: 'Archivé',
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
  submitted: {
    label: 'Soumise',
    dot: 'bg-sky-600',
    text: 'text-sky-800',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  under_review: {
    label: 'En cours',
    dot: 'bg-amber-500',
    text: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  evaluated: {
    label: 'Évaluée',
    dot: 'bg-blue-600',
    text: 'text-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  accepted: {
    label: 'Acceptée',
    dot: 'bg-green-600',
    text: 'text-green-800',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  rejected: {
    label: 'Rejetée',
    dot: 'bg-red-600',
    text: 'text-red-800',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  admitted: {
    label: 'Admis',
    dot: 'bg-teal-600',
    text: 'text-teal-800',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  pending: {
    label: 'En attente',
    dot: 'bg-amber-500',
    text: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  confirmed: {
    label: 'Confirmé',
    dot: 'bg-green-600',
    text: 'text-green-800',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  failed: {
    label: 'Échoué',
    dot: 'bg-red-600',
    text: 'text-red-800',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
};

const FALLBACK: StatusConfig = {
  label: '—',
  dot: 'bg-slate-400',
  text: 'text-slate-600',
  bg: 'bg-slate-100',
  border: 'border-slate-200',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  const cfg = STATUS_MAP[status as StatusKey] ?? FALLBACK;
  const displayLabel = label || cfg.label;
  const padding = size === 'md' ? 'px-3 py-1.5' : 'px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
