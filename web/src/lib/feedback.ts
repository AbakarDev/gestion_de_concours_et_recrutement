import { toast } from 'sonner';
import type { AxiosError } from 'axios';

export { toast };

export function getApiError(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
  const data = axiosError?.response?.data;

  if (data?.message) {
    return data.message;
  }

  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (typeof first === 'string') {
      return first;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export const notify = {
  success: (message: string, description?: string) =>
    toast.success(message, { description }),
  error: (error: unknown, fallback = 'Une erreur est survenue.') =>
    toast.error(getApiError(error, fallback)),
  info: (message: string, description?: string) =>
    toast.info(message, { description }),
  warning: (message: string, description?: string) =>
    toast.warning(message, { description }),
};
