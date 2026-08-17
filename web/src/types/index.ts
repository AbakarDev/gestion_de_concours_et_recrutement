export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  nin?: string;
  phone?: string;
  roles: string[];
  is_active?: boolean;
  created_at?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  parent_id: number | null;
  created_at: string;
}

export interface Competition {
  id: number;
  department_id: number;
  department_name?: string;
  title: string;
  reference: string;
  description?: string;
  quota: number;
  required_documents?: string[];
  start_date: string;
  end_date: string;
  registration_open_date?: string | null;
  registration_close_date?: string | null;
  fee_required?: boolean;
  fee_amount?: number | null;
  status: 'draft' | 'published' | 'open' | 'evaluating' | 'closed' | 'archived';
  status_label?: string;
  published_at?: string;
  results_published_at?: string | null;
  created_at: string;
}

export interface JobOffer {
  id: number;
  competition_id: number;
  competition_title?: string;
  title: string;
  description?: string | null;
  positions_count: number;
  location?: string;
  requirements?: Record<string, string>;
  required_documents?: string[];
  fee_required?: boolean;
  fee_amount?: number | null;
  closing_date?: string | null;
  status: 'draft' | 'published' | 'open' | 'evaluating' | 'closed' | 'archived';
  status_label?: string;
  created_at: string;
}

export interface ApplicationDocument {
  id: number;
  candidate_id?: number;
  application_id?: number;
  type: string;
  type_label?: string;
  path?: string | null;
  url?: string | null;
  status: string;
  created_at: string;
}

export interface DocumentTypeCatalog {
  code: string;
  label: string;
  category: string;
  category_label: string;
  generated: boolean;
  accept: string[];
}

export interface DossierChecklistItem {
  code: string;
  label: string;
  required: boolean;
  present: boolean;
  generated: boolean;
  hint: string;
}

export interface DiplomaRecord {
  id: number;
  type_diplome?: string;
  niveau: string;
  etablissement: string;
  specialite?: string | null;
  annee: number;
  document_id?: number | null;
}

export interface ExperienceRecord {
  id: number;
  poste: string;
  employeur: string;
  date_debut: string;
  date_fin?: string | null;
  description?: string | null;
}

export interface DossierPayload {
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    nin?: string | null;
    date_naissance?: string | null;
    lieu_naissance?: string | null;
    nationalite?: string | null;
    situation_familiale?: string | null;
    sexe?: string | null;
    adresse?: string | null;
    photo_url?: string | null;
    has_photo?: boolean;
    langues: Array<{ langue: string; niveau: string }>;
  };
  diplomas: DiplomaRecord[];
  experiences: ExperienceRecord[];
  documents: ApplicationDocument[];
  completeness: {
    ready: boolean;
    can_generate_cv: boolean;
    checklist: DossierChecklistItem[];
  };
  document_types: DocumentTypeCatalog[];
  diploma_levels: string[];
}

export interface Score {
  id: number;
  epreuve: string;
  note: number;
  commentaire?: string;
  created_at: string;
}

export interface Candidate {
  id: number;
  user_id: number;
  date_naissance: string;
  sexe: string;
  adresse: string;
  nni?: string;
}

export interface Application {
  id: number;
  application_number?: string | null;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'evaluated';
  status_label?: string;
  admin_notes?: string;
  rejection_reason?: string;
  motivation_objet?: string | null;
  motivation_corps?: string | null;
  dossier_frozen_at?: string | null;
  anonymat_number?: string | null;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    nin?: string;
    phone?: string;
  } | null;
  job_offer: {
    id: number;
    title: string;
    competition_title?: string;
  };
  payment?: {
    required: boolean;
    confirmed: boolean;
    status?: string | null;
    montant?: number | string | null;
  } | null;
  documents?: ApplicationDocument[];
  scores?: Score[];
  convocation_url?: string | null;
  submitted_at?: string | null;
  status_history?: Array<{
    id: number;
    from_status: string | null;
    to_status: string;
    reason?: string | null;
    changed_by?: string | null;
    created_at?: string;
  }>;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
