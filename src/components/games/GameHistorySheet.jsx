import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import GameSheet from '@/components/games/GameSheet';
import { formatCoins, gameLabel } from '@/components/games/gameHelpers';

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

/** Oyun geçmişi ve toplam istatistikler. */
export default function GameHistorySheet({ open, onClose, session }) {
  const [busy, setBusy] = useState(false);
  const { history = [], profile } = session;

  const refresh = async () => {
    setBusy(true);
    await session.refreshHistory();
    setBusy(false);
  };

  const stats = [
    ['SPIN', profile?.total_spins],
    ['BAHİS', profile?.total_wagered],
    ['KAZANÇ', profile?.total_won],
  ];

  return (
    <GameSheet open={open} onClose={onClose} title="OYUN GEÇMİŞİ" subtitle={`Bakiye ${formatCoins(profile?.coins || 0)} coin`}>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-black/40 px-1.5 py-2">
            <p className="text-[9px] font-black tracking-widest text-white/50">{label}</p>
            <p className="truncate text-xs font-black tabular-nums text-game-gold">{formatCoins(value || 0)}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={refresh}
        disabled={busy}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-game-gold/35 py-2 text-[11px] font-black text-game-gold disabled:opacity-40"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} /> Yenile
      </button>
      <div className="mt-2 space-y-1">
        {history.length === 0 && <p className="py-4 text-center text-[11px] text-white/45">Henüz oyun oynamadın.</p>}
        {history.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-2 py-1.5">
            <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-black text-white/70">{gameLabel(item.game)}</span>
            <span className="min-w-0 flex-1 truncate text-[11px] text-white/70">{item.detail || '—'}</span>
            <span className="shrink-0 text-[10px] tabular-nums text-white/45">{formatDate(item.created_date)}</span>
            <span className={`shrink-0 text-[11px] font-black tabular-nums ${item.payout > 0 ? 'text-game-green' : 'text-game-red'}`}>
              {item.payout > 0 ? `+${formatCoins(item.payout)}` : `-${formatCoins(item.bet)}`}
            </span>
          </div>
        ))}
      </div>
    </GameSheet>
  );
}