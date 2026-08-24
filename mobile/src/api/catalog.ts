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

export type DocumentTypeItem = {
  code: string;
  label: string;
  generated: boolean;
  accept: string[];
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
    can_generate_cv?: boolean;
    checklist: Array<{
      code: string;
      label: string;
      required: boolean;
      present: boolean;
      generated?: boolean;
      hint?: string;
    }>;
  };
};

function asRnFile(uri: string, name: string, type: string) {
  return { uri, name, type } as unknown as Blob;
}

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

export async function listDocumentTypes(): Promise<DocumentTypeItem[]> {
  const res = await api.get('/document-types');
  return (res.data.data || []) as DocumentTypeItem[];
}

export async function uploadPhoto(uri: string, mime = 'image/jpeg'): Promise<void> {
  const form = new FormData();
  form.append('photo', asRnFile(uri, 'photo.jpg', mime));
  await api.post('/candidate/dossier/photo', form);
}

export async function uploadDocument(uri: string, name: string, mime: string, type: string): Promise<void> {
  const form = new FormData();
  form.append('file', asRnFile(uri, name, mime));
  form.append('type', type);
  await api.post('/documents/upload', form);
}

export async function addDiploma(data: { type_diplome: string; etablissement: string; annee: number; specialite?: string }) {
  await api.post('/candidate/dossier/diplomas', data);
}
