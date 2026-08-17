import api from './client';

export type JobOffer = {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  positions_count?: number;
  status: string;
  status_label?: string;
  competition_title?: string;
  fee_required?: boolean;
  fee_amount?: number | null;
  closing_date?: string | null;
};

export type DossierPayload = {
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    nin?: string | null;
    date_naissance?: string | null;
    adresse?: string | null;
    has_photo?: boolean;
  };
  diplomas: Array<{ id: number; niveau: string; etablissement: string; annee: number }>;
  experiences: Array<{ id: number; poste: string; employeur: string }>;
  completeness: {
    ready: boolean;
    checklist: Array<{ code: string; label: string; required: boolean; present: boolean }>;
  };
};

export async function listOffers(): Promise<JobOffer[]> {
  const res = await api.get('/job-offers', { params: { per_page: 50 } });
  return (res.data.data || []) as JobOffer[];
}

export async function countCompetitions(): Promise<number> {
  const res = await api.get('/competitions', { params: { per_page: 1 } });
  return Number(res.data.meta?.total ?? (res.data.data || []).length);
}

export async function getDossier(jobOfferId?: number): Promise<DossierPayload> {
  const res = await api.get('/candidate/dossier', {
    params: jobOfferId ? { job_offer_id: jobOfferId } : undefined,
  });
  return res.data.data as DossierPayload;
}
