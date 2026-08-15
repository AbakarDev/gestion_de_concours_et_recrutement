/** Libellé affiché au jury : jamais le n° de dossier nominatif APP-…. */
export function juryDossierLabel(entry: {
  anonymat_number?: string | null;
}): string {
  return entry.anonymat_number || 'Copie anonymisée';
}

/** Classement / tableaux staff : anonymat en priorité, sinon n° de dossier. */
export function rankingDossierLabel(entry: {
  anonymat_number?: string | null;
  application_number?: string | null;
}): string {
  return entry.anonymat_number || entry.application_number || '—';
}
