import React from 'react';
import { Megaphone } from 'lucide-react';
import { Image } from '@/components/ui/image';
import SlotSymbolIcon from './SlotSymbolIcon';
import useBigWins from './useBigWins';
import './winnerTicker.css';

// Şeritte aynı anda görünen satır sayısı ve her satırın yüksekliği.
const VISIBLE_ROWS = 2;
const ROW_HEIGHT = 26;
// Bir satırın ekranda kalma süresi — şeridin kayma hızı.
const SECONDS_PER_ROW = 2.8;

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

const symbolsOf = (winner) => {
  const list = Array.isArray(winner.symbols) && winner.symbols.length ? winner.symbols : [winner.symbol];
  return list.filter(Boolean).slice(0, 3);
};

function TickerRow({ winner }) {
  return (
    <li className="flex h-[26px] items-center gap-1.5 px-2">
      <Megaphone className="h-3.5 w-3.5 shrink-0 text-white/90" />
      <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-slot ring-1 ring-slot-gold/50">
        {winner.avatar ? (
          <Image src={winner.avatar} alt="" className="h-full w-full" fittingType="fill" quality={60} />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[9px] font-black text-slot-gold">
            {(winner.name || '?').trim().charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="max-w-[4rem] truncate text-[10px] font-bold text-white">{winner.name || 'Kullanıcı'}</span>
      <span className="shrink-0 text-[9px] text-white/75">şanslı çekilişten</span>
      <span className="flex shrink-0 items-center gap-px">
        {symbolsOf(winner).map((symbol, index) => (
          <SlotSymbolIcon key={`${symbol}-${index}`} symbol={symbol} size={12} />
        ))}
      </span>
      <span className="shrink-0 text-[9px] text-white/75">havuzdan</span>
      <span className="shrink-0 font-mono text-[11px] font-black text-slot-orange">{format(winner.won)}</span>
      <span className="shrink-0 text-[9px] text-white/75">kazandı</span>
    </li>
  );
}

/** Oyun ekranının üstünde yukarı doğru kayan 20.000+ coin kazanan şeridi. */
export default function WinnerTicker() {
  const { winners, status } = useBigWins();
  const rows = winners.slice(0, 8);
  // Kesintisiz kayma için satırlar iki kopya halinde döner.
  const loop = rows.length ? [...rows, ...rows] : [];
  const duration = Math.max(8, rows.length * SECONDS_PER_ROW);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-[48px] z-30 w-[88%] -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-black/65 backdrop-blur-sm"
      style={{ height: VISIBLE_ROWS * ROW_HEIGHT }}
    >
      {loop.length ? (
        <ul className="winner-ticker-scroll" style={{ animationDuration: `${duration}s` }}>
          {loop.map((winner, index) => (
            <TickerRow key={`${winner.id}-${index}`} winner={winner} />
          ))}
        </ul>
      ) : (
        <p className="flex h-full items-center justify-center px-2 text-center text-[10px] font-bold text-white/70">
          {status === 'loading' ? 'Kazananlar yükleniyor...' : '20.000+ coin kazananlar burada görünür.'}
        </p>
      )}
    </div>
  );
}