import { createContext, ReactNode, startTransition, useContext, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ExternalLink, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { AppNotification } from '../../types';
import { apiNotificationRead, apiNotificationsClearAll, apiNotificationsList, getAuthToken } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  notifications: AppNotification[];
  unread: number;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  panelOpen: boolean;
  togglePanel: () => void;
  closePanel: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const SOCKET_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

function toneForMilestone(milestone: string): ToastType {
  if (/failed|rejected|error/i.test(milestone)) return 'error';
  if (/verified|delivered|signed|payment|claimed/i.test(milestone)) return 'success';
  return 'info';
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close panel when clicking outside or pressing Escape
  useEffect(() => {
    if (!panelOpen) return;
    function handleDown(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setPanelOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPanelOpen(false);
    }
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [panelOpen]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnread(0);
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    apiNotificationsList()
      .then((data) => {
        startTransition(() => {
          setNotifications(data.notifications || []);
          setUnread(data.unread || 0);
        });
      })
      .catch(() => {
        setNotifications([]);
        setUnread(0);
      });

    const token = getAuthToken();
    if (!token) return;

    const socket = io(SOCKET_BASE, {
      transports: ['websocket'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('notification:new', (payload: AppNotification) => {
      startTransition(() => {
        setNotifications((prev) => [payload, ...prev].slice(0, 30));
        setUnread((prev) => prev + 1);
        showToast(payload.message, toneForMilestone(payload.milestone), payload.title);
      });
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [user]);

  function showToast(message: string, type: ToastType = 'info', title?: string) {
    const content = title ? `${title}: ${message}` : message;
    if (type === 'success') {
      toast.success(content);
      return;
    }
    if (type === 'error') {
      toast.error(content);
      return;
    }
    toast(content);
  }

  async function markAsRead(id: string) {
    await apiNotificationRead(id);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setUnread((prev) => Math.max(0, prev - 1));
  }

  async function clearAll() {
    setClearingAll(true);
    try {
      await apiNotificationsClearAll();
      setNotifications([]);
      setUnread(0);
    } finally {
      setClearingAll(false);
    }
  }

  return (
    <ToastContext.Provider
      value={{
        showToast,
        notifications,
        unread,
        markAsRead,
        clearAll,
        panelOpen,
        togglePanel: () => setPanelOpen((prev) => !prev),
        closePanel: () => setPanelOpen(false),
      }}
    >
      {children}
      {user && panelOpen && (
        <div ref={(el) => (panelRef.current = el)} className="fixed right-4 top-20 z-20 w-[22rem] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Realtime Updates</p>
              <p className="text-xs text-slate-500">Document milestones and lawyer actions</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void clearAll()}
                disabled={notifications.length === 0 || clearingAll}
                className="rounded-full px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                {clearingAll ? 'Clearing...' : 'Clear All'}
              </button>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-[28rem] overflow-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">No notifications yet.</div>
            ) : (
              notifications.map((item) => (
                <div key={item.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    {item.status !== 'read' && (
                      <button
                        type="button"
                        onClick={() => void markAsRead(item.id)}
                        className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {item.deep_link_url && (
                    <a
                      href={item.deep_link_url}
                      onClick={() => void markAsRead(item.id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-700"
                    >
                      Open tracking
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
