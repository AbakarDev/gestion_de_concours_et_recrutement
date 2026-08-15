export const Role = {
  SuperAdmin: 'SuperAdmin',
  Administrateur: 'Administrateur',
  ResponsableConcours: 'Responsable de concours',
  Jury: 'Jury',
  Recruteur: 'Recruteur',
  Candidat: 'candidat',
} as const;

export type RoleName = (typeof Role)[keyof typeof Role];

export const StaffRoles: RoleName[] = [
  Role.SuperAdmin,
  Role.Administrateur,
  Role.ResponsableConcours,
  Role.Jury,
  Role.Recruteur,
];

export const ApplicationInstructors: RoleName[] = [
  Role.SuperAdmin,
  Role.Administrateur,
];

export const CompetitionManagers: RoleName[] = [
  Role.SuperAdmin,
  Role.ResponsableConcours,
];

export const JobOfferManagers: RoleName[] = [
  Role.SuperAdmin,
  Role.ResponsableConcours,
  Role.Recruteur,
];

export const Evaluators: RoleName[] = [
  Role.SuperAdmin,
  Role.Jury,
];

export const RankingViewers: RoleName[] = [
  Role.SuperAdmin,
  Role.Administrateur,
  Role.ResponsableConcours,
  Role.Jury,
];

export const DepartmentViewers: RoleName[] = [
  Role.SuperAdmin,
  Role.Administrateur,
  Role.ResponsableConcours,
];

export const ApplicationViewers: RoleName[] = [
  Role.SuperAdmin,
  Role.Administrateur,
  Role.ResponsableConcours,
  Role.Recruteur,
];
