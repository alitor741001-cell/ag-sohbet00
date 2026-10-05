import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';

/** Sistem bildirim butonu: tüm bildirimlerin okunmamış sayısını gösterir,
    dokununca bildirimler tam ekran sayfasında açılır. */
export default function NotificationBell() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = () => base44.entities.Notification.filter({ user_id: user.id }, '-created_date', 50)
      .then((rows) => setUnread(rows.filter((n) => !n.read).length))
      .catch(() => {});
    load();
    const unsub = base44.entities.Notification.subscribe(load);
    // Yoklama yedeği — realtime kaçırsa diye 30 saniyede bir.
    const interval = setInterval(() => { if (document.visibilityState !== 'hidden') load(); }, 30000);
    return () => { unsub(); clearInterval(interval); };
  }, [user?.id]);

  return (
    <button onClick={() => navigate('/bildirimler')} aria-label="Bildirimler"
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/5 active:scale-95">
      <Bell className="h-5 w-5 text-white" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}