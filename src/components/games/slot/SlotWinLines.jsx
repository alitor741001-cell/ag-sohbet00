import React from 'react';
import { SLOT_LAYOUT } from '@/components/games/slot/slotLayout';

// Kazanç çizgisi katmanı, makara penceresinin kendi koordinatlarında çizilir.
const W = 968;
const H = 670;
const CW = W / 5;
const CH = H / 3;
// Çizgi renkleri sırayla kullanılır; aynı anda birçok kazanç çizgisi okunabilir kalır.
const COLORS = ['#ffd700', '#4ade80', '#38bdf8', '#f472b6', '#a78bfa', '#fb923c'];

/** Kazanan sembolleri çerçeveleyip aralarından geçen kazanç çizgilerini çizer. */
export default function SlotWinLines({ wins }) {
  if (!wins?.length) return null;
  return (
    <svg
      aria-hidden="true"
      className="slot-win-lines pointer-events-none absolute"
      style={SLOT_LAYOUT.reelWindow}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
    >
      {wins.slice(0, 12).map((win, index) => {
        const color = COLORS[index % COLORS.length];
        const points = win.cells
          .map((cell) => `${cell.reel * CW + CW / 2},${cell.row * CH + CH / 2}`)
          .join(' ');
        return (
          <g key={`${win.line}-${index}`} style={{ animationDelay: `${index * 90}ms` }}>
            {win.cells.map((cell) => (
              <rect
                key={`${cell.reel}-${cell.row}`}
                x={cell.reel * CW + 8}
                y={cell.row * CH + 8}
                width={CW - 16}
                height={CH - 16}
                rx="16"
                fill={color}
                fillOpacity="0.16"
                stroke={color}
                strokeWidth="3"
              />
            ))}
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 7px ${color})` }}
            />
          </g>
        );
      })}
    </svg>
  );
}