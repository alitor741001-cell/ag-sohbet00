import React, { useCallback, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Tablo, kazananlar değiştikçe kendini yeniler.
const REFRESH_MS = 12000;

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** Canlı kazanan tablosu: en çok coin kazanan kullanıcılar. */
export default function WinnerBoard() {
  const [leaders, setLeaders] = useState([]);
  const [me, setMe] = useState('');
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    try {
      const response = await base44.functions.invoke('slot-game', { action: 'leaders' });
      setLeaders(response.data?.leaders || []);
      setMe(response.data?.me || '');
      setStatus('ready');
    } catch (error) {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <section className="mb-3 rounded-2xl border border-slot-gold/40 bg-slot-surface p-3">
      <header className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-slot-gold" />
        <p className="min-w-0 flex-1 truncate text-[11px] font-black tracking-widest text-slot-gold">CANLI KAZANANLAR</p>
        <span className="flex shrink-0 items-center gap-1 text-[9px] font-black text-slot-green">
          <span className="h-1.5 w-1.5 rounded-full bg-slot-green" />
          CANLI
        </span>
      </header>

      {status === 'loading' && <p className="mt-2 text-center text-[11px] text-white/60">Yükleniyor...</p>}

      {status === 'error' && <p className="mt-2 text-center text-[11px] text-white/60">Tablo şu an alınamadı.</p>}

      {status === 'ready' && leaders.length === 0 && (
        <p className="mt-2 text-center text-[11px] text-white/60">Henüz kazanan yok, ilk sen ol.</p>
      )}

      {status === 'ready' && leaders.length > 0 && (
        <ol className="mt-2 space-y-1">
          {leaders.map((leader, index) => (
            <li key={leader.user_id || index} className="flex items-center gap-2 rounded-lg bg-slot-panel px-2 py-1.5">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                  index === 0 ? 'bg-slot-gold text-slot' : 'bg-slot text-slot-gold'
                }`}
              >
                {leader.rank || index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">
                {leader.name}
                {leader.user_id === me ? ' (sen)' : ''}
              </span>
              <span className="shrink-0 font-mono text-xs font-black text-slot-green">{format(leader.won)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}