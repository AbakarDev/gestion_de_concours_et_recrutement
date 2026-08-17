export function formatDateFr(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

export function formatTimeFr(value?: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function averageScore(notes: Array<{ note: number | string }> | undefined): string {
  if (!notes?.length) return '—';
  const sum = notes.reduce((acc, row) => acc + parseFloat(String(row.note)), 0);
  return `${(sum / notes.length).toFixed(2)} / 20`;
}
