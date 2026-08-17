import api from './client';
import type { StoredUser } from '../auth/storage';

type AuthPayload = {
  user: StoredUser;
  access_token: string;
  refresh_token?: string;
};

export async function login(email: string, password: string): Promise<AuthPayload> {
  const res = await api.post('/auth/login', { email, password });
  return res.data.data as AuthPayload;
}

export async function register(payload: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  nin?: string;
  phone?: string;
}): Promise<AuthPayload> {
  const res = await api.post('/auth/register', payload);
  return res.data.data as AuthPayload;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
