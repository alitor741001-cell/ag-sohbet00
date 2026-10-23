import { Link } from 'react-router-dom';
import { Users, Building2 } from 'lucide-react';
import NotificationBell from '@/components/friends/NotificationBell';

/** Mesajlar üst başlığı: görsel yerine doğal, profesyonel bir başlık çubuğu.
    İstekler, sistem bildirimi ve ajans mesajları butonları içerir. */
export default function MessagesBanner({ relations, userId, invoke, showBell = true }) {
  const pending = Array.isArray(relations) ? relations.filter((r) => r.status === 'pending').length : 0;
  return (
    <div className="sticky top-0 z-30 w-full">
      <div className="relative flex items-center justify-between gap-2 px-4 py-3"
        style={{ background: 'linear-gradient(180deg, rgba(7,6,11,0.98) 0%, rgba(7,6,11,0.92) 70%, rgba(7,6,11,0) 100%)' }}>
        <h1 className="select-none text-lg font-bold uppercase tracking-wide text-white">Mesajlar</h1>
        <div className="flex items-center gap-2">
          <Link to="/arkadaslar/istekler" aria-label="İstekler"
            className="relative flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-white active:scale-95">
            <Users className="h-4 w-4" />
            <span className="whitespace-nowrap text-[11px] font-semibold leading-none">İstekler</span>
            {pending > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {pending > 9 ? '9+' : pending}
              </span>
            )}
          </Link>
          {showBell && <NotificationBell />}
          <Link to="/ajans/mesajlar" aria-label="Ajans mesajları"
            className="flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-white active:scale-95">
            <Building2 className="h-4 w-4" />
            <span className="whitespace-nowrap text-[11px] font-semibold leading-none">Ajans</span>
          </Link>
        </div>
      </div>
    </div>
  );
}