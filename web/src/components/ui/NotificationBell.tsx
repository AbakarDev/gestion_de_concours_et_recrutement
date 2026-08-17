import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Settings, FileText } from 'lucide-react';
import { notificationsApi } from '../../api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: {
    message: string;
    application_id?: number;
    status?: string;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const messageOf = (notification: Notification) => {
    const raw = notification.data as Notification['data'] | string | undefined;
    if (!raw) return 'Nouvelle notification';
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return parsed.message || 'Nouvelle notification';
      } catch {
        return raw;
      }
    }
    return raw.message || 'Nouvelle notification';
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await notificationsApi.list({ per_page: 15 });
      const payload = res.data as any;
      setNotifications(payload.data || payload || []);
      setUnreadCount(payload.meta?.unread_count || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur de marquage comme lu', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur de marquage total', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-slate-500 hover:text-slate-900 focus:outline-none transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-[80] w-[90vw] sm:w-80 mt-3 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transform origin-top-right transition-all max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-700 hover:text-blue-800 flex items-center transition-colors font-medium"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Tout marquer lu
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto custom-scrollbar flex-1 min-h-[150px]">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-sm font-medium text-slate-600">Aucune notification</p>
                <p className="text-xs text-slate-400 mt-1">Vous êtes à jour pour le moment.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 transition-all hover:bg-slate-100 cursor-pointer ${!notification.read_at ? 'bg-primary-500/[0.08]' : ''}`}
                    onClick={() => !notification.read_at && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-soft transition-colors ${!notification.read_at ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                        {notification.type.includes('Status') ? <FileText className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!notification.read_at ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                          {messageOf(notification)}
                        </p>
                        <p className={`text-xs mt-1.5 ${!notification.read_at ? 'text-blue-700' : 'text-slate-400'}`}>
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <div className="flex-shrink-0 flex items-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
            <p className="text-[11px] text-slate-400">Les 15 dernières notifications</p>
          </div>
        </div>
      )}
    </div>
  );
}
