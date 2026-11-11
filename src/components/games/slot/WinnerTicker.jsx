import React from 'react';
import { Volume2 } from 'lucide-react';
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
    <li className="flex h-[26px] items-center gap-1.5 px-2 text-[10px]">
      <Volume2 className="h-3.5 w-3.5 shrink-0 text-[#9f85e8]" />
      <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-slot ring-1 ring-[#a78bfa]/70">
        {winner.avatar ? (
          <Image src={winner.avatar} alt="" className="h-full w-full" fittingType="fill" quality={60} />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[9px] font-black text-slot-gold">
            {(winner.name || '?').trim().charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="max-w-[4.6rem] truncate font-black text-[#c084fc]">{winner.name || 'Kullanıcı'}</span>
      <span className="shrink-0 font-semibold text-[#b8a5e3]">şanslı çekilişten</span>
      <span className="flex shrink-0 items-center gap-0.5">
        {symbolsOf(winner).map((symbol, index) => (
          <SlotSymbolIcon key={`${symbol}-${index}`} symbol={symbol} size={14} />
        ))}
      </span>
      <span className="shrink-0 font-semibold text-[#b8a5e3]">havuzdan</span>
      <span className="shrink-0 font-mono text-[11px] font-black text-[#fb923c]">{format(winner.won)}</span>
      <span className="shrink-0 font-semibold text-[#b8a5e3]">kazandı.</span>
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
        <p className="flex h-full items-center justify-center px-2 text-center text-[10px] font-bold text-[#c4b5fd]">
          {status === 'loading' ? 'Kazananlar yükleniyor...' : '20.000+ coin kazananlar burada görünür.'}
        </p>
      )}
    </div>
  );
}