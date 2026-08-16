import axios from 'axios';
import api from '../lib/axios';
import { downloadExport } from '../lib/download';
import type { ApiResponse, PaginatedResponse, User, Competition, JobOffer, Application, ApplicationDocument, DossierPayload, DocumentTypeCatalog } from '../types';

export { api };

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password }),

  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    nin?: string;
    phone?: string;
  }) => api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),

  logout: () => api.post('/auth/logout'),
  refresh: (refresh_token: string) =>
    axios.post<ApiResponse<{ user: User; access_token: string; refresh_token: string }>>(
      `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/auth/refresh`,
      { refresh_token }
    ),
};

export const departmentsApi = {
  list: (params?: any) => api.get<ApiResponse<any>>('/departments', { params }),
  create: (data: any) => api.post<ApiResponse<any>>('/departments', data),
  update: (id: number, data: any) => api.put<ApiResponse<any>>(`/departments/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<any>>(`/departments/${id}`),
};

export const competitionsApi = {
  list: (params?: Record<string, any>) => api.get<PaginatedResponse<Competition>>('/competitions', { params }),
  get: (id: number) => api.get<ApiResponse<Competition>>(`/competitions/${id}`),
  create: (data: Partial<Competition>) => api.post<ApiResponse<Competition>>('/competitions', data),
  update: (id: number, data: Partial<Competition>) => api.put<ApiResponse<Competition>>(`/competitions/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/competitions/${id}`),
  publish: (id: number) => api.post<ApiResponse<Competition>>(`/competitions/${id}/publish`),
  unpublish: (id: number) => api.post<ApiResponse<Competition>>(`/competitions/${id}/unpublish`),
  close: (id: number) => api.post<ApiResponse<Competition>>(`/competitions/${id}/close`),
  publishResults: (id: number) => api.post<ApiResponse<Competition>>(`/competitions/${id}/publish-results`),
  dispatch: (id: number) => api.post<ApiResponse<any>>(`/competitions/${id}/dispatch`),
};

export const jobOffersApi = {
  list: (params?: Record<string, any>) => api.get<PaginatedResponse<JobOffer>>('/job-offers', { params }),
  get: (id: number) => api.get<ApiResponse<JobOffer>>(`/job-offers/${id}`),
  create: (data: Partial<JobOffer>) => api.post<ApiResponse<JobOffer>>('/job-offers', data),
  update: (id: number, data: Partial<JobOffer>) => api.put<ApiResponse<JobOffer>>(`/job-offers/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/job-offers/${id}`),
  publish: (id: number) => api.post<ApiResponse<JobOffer>>(`/job-offers/${id}/publish`),
};

export const applicationsApi = {
  list: (params?: any) => api.get<PaginatedResponse<Application>>('/applications', { params }),
  get: (id: number) => api.get<ApiResponse<Application>>(`/applications/${id}`),
  create: (data: { job_offer_id: number; motivation_objet?: string; motivation_corps?: string }) => api.post<ApiResponse<Application>>('/applications', data),
  updateStatus: (id: number, data: { status: string; admin_notes?: string; rejection_reason?: string }) => 
    api.patch<ApiResponse<Application>>(`/applications/${id}/status`, data),
  downloadConvocation: (id: number, filename?: string) =>
    downloadExport(`/applications/${id}/convocation`, filename || `convocation_${id}.pdf`),
};

export const documentsApi = {
  list: () => api.get<ApiResponse<ApplicationDocument[]>>('/documents'),
  upload: (data: FormData) =>
    api.post<ApiResponse<ApplicationDocument>>('/documents/upload', data),
  viewBlob: async (id: number) => {
    const res = await api.get(`/documents/${id}/view`, { responseType: 'blob' });
    return URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] as string }));
  },
  download: async (id: number, filename?: string) => {
    const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `document_${id}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  },
  delete: (id: number) => api.delete<ApiResponse<null>>(`/documents/${id}`),
};

export const dossierApi = {
  types: () => api.get<ApiResponse<DocumentTypeCatalog[]>>('/document-types'),
  get: (jobOfferId?: number) =>
    api.get<ApiResponse<DossierPayload>>('/candidate/dossier', {
      params: jobOfferId ? { job_offer_id: jobOfferId } : undefined,
    }),
  update: (data: Record<string, unknown>) =>
    api.put<ApiResponse<DossierPayload>>('/candidate/dossier', data),
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('photo', file, file.name);
    return api.post<ApiResponse<DossierPayload>>('/candidate/dossier/photo', form);
  },
  viewPhoto: async () => {
    const res = await api.get('/candidate/dossier/photo', { responseType: 'blob' });
    return URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] as string }));
  },
  downloadCv: async () => {
    const res = await api.get('/candidate/dossier/cv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CV_administratif.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  },
  addDiploma: (form: FormData) => api.post('/candidate/dossier/diplomas', form),
  deleteDiploma: (id: number) => api.delete(`/candidate/dossier/diplomas/${id}`),
  addExperience: (data: Record<string, unknown>) => api.post('/candidate/dossier/experiences', data),
  updateExperience: (id: number, data: Record<string, unknown>) => api.put(`/candidate/dossier/experiences/${id}`, data),
  deleteExperience: (id: number) => api.delete(`/candidate/dossier/experiences/${id}`),
};



export const usersApi = {
  list: (params?: any) => api.get<PaginatedResponse<User>>('/users', { params }),
  create: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
  }) => api.post<ApiResponse<User>>('/users', data),
  updateRole: (id: number, role: string) => api.put<ApiResponse<User>>(`/users/${id}/role`, { role }),
  toggleActive: (id: number) => api.patch<ApiResponse<User>>(`/users/${id}/active`),
};

export const settingsApi = {
  get: () => api.get<ApiResponse<Record<string, string>>>('/settings'),
  update: (data: Record<string, string | boolean>) => api.put<ApiResponse<Record<string, string>>>('/settings', data),
  public: () => api.get<ApiResponse<any>>('/public/settings'),
};

export const rankingApi = {
  getByJobOffer: (jobOfferId: number) => api.get<any>(`/job-offers/${jobOfferId}/ranking`),
};

export const publicApi = {
  getStats: () => api.get<ApiResponse<{
    active_competitions: number;
    total_candidates: number;
    departments_count: number;
    total_jobs: number;
  }>>('/public/stats'),
  getSettings: () => api.get<ApiResponse<{
    platform_name: string;
    platform_subtitle: string;
    contact_email: string;
    contact_phone: string;
    support_message: string;
    registration_enabled: boolean;
  }>>('/public/settings'),
};

export const adminStatsApi = {
  getDashboard: () => api.get<ApiResponse<any>>('/admin/dashboard-stats'),
};

export const paymentsApi = {
  initiate: (data: { application_id: number; phone_number: string }) =>
    api.post<ApiResponse<{ transaction_ref: string }>>('/payments/initiate', data),
  simulate: (data: { application_id: number }) =>
    api.post<ApiResponse<null>>('/payments/simulate', data),
};

export const notificationsApi = {
  list: (params?: any) => api.get<ApiResponse<any>>('/notifications', { params }),
  markAsRead: (id: string) => api.post<ApiResponse<any>>(`/notifications/${id}/read`),
  markAllAsRead: () => api.post<ApiResponse<any>>('/notifications/read-all'),
};
