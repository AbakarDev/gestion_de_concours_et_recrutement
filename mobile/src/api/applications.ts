import api from './client';

export type ApplicationRow = {
  id: number;
  application_number?: string | null;
  status: string;
  status_label?: string;
  submitted_at?: string | null;
  rejection_reason?: string | null;
  payment?: { required?: boolean; confirmed?: boolean; status?: string | null; montant?: number | null };
  convocation_url?: string | null;
  job_offer?: {
    id?: number;
    title?: string;
    competition_title?: string;
  };
};

export async function listMine(): Promise<ApplicationRow[]> {
  const res = await api.get('/applications', { params: { per_page: 50 } });
  return (res.data.data || []) as ApplicationRow[];
}

export async function getApplication(id: number): Promise<ApplicationRow> {
  const res = await api.get(`/applications/${id}`);
  return res.data.data as ApplicationRow;
}

export async function applyToOffer(jobOfferId: number, extra?: { motivation_objet?: string; motivation_corps?: string }) {
  const res = await api.post('/applications', { job_offer_id: jobOfferId, ...extra });
  return res.data.data as ApplicationRow;
}

export async function simulatePayment(applicationId: number) {
  await api.post('/payments/simulate', { application_id: applicationId });
}
