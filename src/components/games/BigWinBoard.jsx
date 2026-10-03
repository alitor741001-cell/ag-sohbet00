import React from 'react';
import { Crown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import SlotSymbolIcon from './slot/SlotSymbolIcon';
import useBigWins from './slot/useBigWins';

// Sembolün kısa adı — ikonun yanında okunur.
const SYMBOL_LABELS = {
  ten: '10',
  jack: 'J',
  queen: 'Q',
  king: 'K',
  ace: 'A',
  gem: 'ELMAS',
  eagle: 'KARTAL',
  tiger: 'KAPLAN',
  lion: 'ASLAN',
  free: 'BONUS',
  jackpot: 'JACKPOT',
};

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** Büyük kazanç tablosu: 20.000 coin üzeri turlar, profil, isim, tutar ve gelen sembol. */
export default function BigWinBoard() {
  const { winners, me, status } = useBigWins();

  return (
    <section className="mb-3 rounded-2xl border border-slot-gold/40 bg-slot-surface p-3">
      <header className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-slot-gold" />
        <p className="min-w-0 flex-1 truncate text-[11px] font-black tracking-widest text-slot-gold">
          BÜYÜK KAZANÇLAR · 20B+
        </p>
        <span className="flex shrink-0 items-center gap-1 text-[9px] font-black text-slot-green">
          <span className="h-1.5 w-1.5 rounded-full bg-slot-green" />
          CANLI
        </span>
      </header>

      {status === 'loading' && <p className="mt-2 text-center text-[11px] text-white/60">Yükleniyor...</p>}

      {status === 'error' && <p className="mt-2 text-center text-[11px] text-white/60">Tablo şu an alınamadı.</p>}

      {status === 'ready' && winners.length === 0 && (
        <p className="mt-2 text-center text-[11px] text-white/60">Henüz 20.000 coin üzeri kazanç yok.</p>
      )}

      {status === 'ready' && winners.length > 0 && (
        <ul className="mt-2 space-y-1">
          {winners.map((winner) => (
            <li key={winner.id} className="flex items-center gap-2 rounded-lg bg-slot-panel px-2 py-1.5">
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slot ring-1 ring-slot-gold/40">
                {winner.avatar ? (
                  <Image src={winner.avatar} alt={winner.name} className="h-full w-full" fittingType="fill" quality={70} />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[11px] font-black text-slot-gold">
                    {(winner.name || '?').trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">
                {winner.name}
                {winner.user_id === me ? ' (sen)' : ''}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <SlotSymbolIcon symbol={winner.symbol} size={18} />
                <span className="text-[9px] font-black tracking-wide text-slot-gold/90">
                  {SYMBOL_LABELS[winner.symbol] || '—'}
                </span>
              </span>
              <span className="shrink-0 font-mono text-xs font-black text-slot-green">+{format(winner.won)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}