import React from 'react';
import { Megaphone } from 'lucide-react';
import { Image } from '@/components/ui/image';
import SlotSymbolIcon from './SlotSymbolIcon';
import useBigWins from './useBigWins';
import './winnerTicker.css';

// Her satırın yüksekliği: şerit yüksekliği tam satırlara yuvarlanır.
export const TICKER_ROW_HEIGHT = 26;
// Şeritte aynı anda görünen satır sayısı (varsayılan yükseklik).
const VISIBLE_ROWS = 3;
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
      <span className="max-w-[4.5rem] truncate text-[10px] font-black text-[#c4b5fd]">{winner.name || 'Kullanıcı'}</span>
      <span className="shrink-0 text-[10px] font-black text-[#c4b5fd]">ve kazandı</span>
      <span className="flex shrink-0 items-center gap-px">
        {symbolsOf(winner).map((symbol, index) => (
          <SlotSymbolIcon key={`${symbol}-${index}`} symbol={symbol} size={13} />
        ))}
      </span>
      <span className="shrink-0 text-[10px] font-black text-[#c4b5fd]">Kazanç</span>
      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-amber-900">$</span>
      <span className="shrink-0 font-mono text-[11px] font-black text-[#ff8a4c]">{format(winner.won)}</span>
    </li>
  );
}

/** Oyun ekranının üstünde yukarı doğru kayan 20.000+ coin kazanan şeridi. */
export default function WinnerTicker({ height = VISIBLE_ROWS * TICKER_ROW_HEIGHT }) {
  const { winners, status } = useBigWins();
  const rows = winners.slice(0, 8);
  // Kayma kutunun yarısı kadar indiği için liste, kutuyu her an dolduracak
  // şekilde (kutunun en az iki katı) çift kopya halinde tekrarlanır.
  const fillRows = Math.ceil(height / TICKER_ROW_HEIGHT) * 2;
  const repeat = rows.length ? Math.max(2, Math.ceil(fillRows / rows.length / 2) * 2) : 0;
  const loop = repeat ? Array.from({ length: repeat }, () => rows).flat() : [];
  // Kayma hızı satır başına aynı kalır.
  const duration = Math.max(8, Math.round((loop.length / 2) * SECONDS_PER_ROW));

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative w-full overflow-hidden"
      style={{ height }}
    >
      {loop.length ? (
        <div className="winner-ticker-fade h-full">
          <ul className="winner-ticker-scroll" style={{ animationDuration: `${duration}s` }}>
            {loop.map((winner, index) => (
              <TickerRow key={`${winner.id}-${index}`} winner={winner} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="flex h-full items-center justify-center px-2 text-center text-[10px] font-bold text-white/70">
          {status === 'loading' ? 'Kazananlar yükleniyor...' : '20.000+ coin kazananlar burada görünür.'}
        </p>
      )}
    </div>
  );
}