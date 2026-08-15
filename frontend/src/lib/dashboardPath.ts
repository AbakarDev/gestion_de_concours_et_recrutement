/** Chemin d’espace après connexion, selon le premier rôle pertinent. */
export function dashboardPath(roles?: string[]): string {
  const r = (role: string) => roles?.some(x => x.toLowerCase() === role.toLowerCase()) ?? false;
  if (r('candidat')) return '/candidate';
  if (r('Jury')) return '/admin/evaluations';
  if (r('Responsable de concours')) return '/admin/competitions';
  if (r('Recruteur')) return '/admin/job-offers';
  if (r('Administrateur')) return '/admin/applications';
  return '/admin';
}
