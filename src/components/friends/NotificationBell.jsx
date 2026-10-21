import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';

/** Sistem bildirim butonu: tüm bildirimlerin okunmamış sayısını gösterir,
    dokununca bildirimler tam ekran sayfasında açılır. */
export default function NotificationBell() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = () => base44.entities.Notification.count({ user_id: user.id, read: false })
      .then(setUnread)
      .catch(() => {});
    load();
    const unsub = subscribeEntity('Notification', () => load());
    // Yoklama yedeği — realtime kaçırsa diye 30 saniyede bir.
    const interval = setInterval(() => { if (document.visibilityState !== 'hidden') load(); }, 120000);
    return () => { unsub(); clearInterval(interval); };
  }, [user?.id]);

  return (
    <button onClick={() => navigate('/bildirimler', { state: { returnTo: location.pathname + location.search } })} aria-label="Sistem bildirimleri"
      className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slot-blue/60 bg-slot-blue/30 px-3 text-slot-text active:scale-95">
      <span className="whitespace-nowrap text-[10px] font-semibold leading-none text-white">Sistem Bildirimi</span>
      <span className="relative flex shrink-0 items-center justify-center">
        <Bell className="h-4 w-4 text-white" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </span>
    </button>
  );
}