import api from './client';

export type AppNotification = {
  id: string;
  data?: { message?: string } | string;
  read_at: string | null;
  created_at: string;
};

export function notificationMessage(n: AppNotification): string {
  const raw = n.data;
  if (!raw) return 'Nouvelle notification';
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed.message || raw;
    } catch {
      return raw;
    }
  }
  return raw.message || 'Nouvelle notification';
}

export async function listNotifications(): Promise<{ items: AppNotification[]; unread: number }> {
  const res = await api.get('/notifications', { params: { per_page: 20 } });
  return {
    items: (res.data.data || []) as AppNotification[],
    unread: Number(res.data.meta?.unread_count ?? 0),
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}
