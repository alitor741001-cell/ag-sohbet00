import React from 'react';

const COINS = Array.from({ length: 12 });

/** Büyük ödül duyurusu: sohbette altın çerçeveli kutlama mesajı ve coin yağmuru. */
export default function SlotWinMessage({ message }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slot-gold/70 bg-gradient-to-br from-slot-gold/25 via-slot-panel to-slot-bg px-3 py-2.5 shadow-[0_0_20px_-4px_hsl(var(--slot-gold)/0.7)] animate-slot-win-pop">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        {COINS.map((_, index) => (
          <span
            key={index}
            className="absolute top-0 animate-slot-win-coin text-sm"
            style={{ left: `${(index * 8) % 96}%`, animationDelay: `${index * 0.15}s` }}
          >
            🪙
          </span>
        ))}
      </span>
      <p className="relative break-words text-center text-[12px] font-black tracking-wide text-slot-gold [overflow-wrap:anywhere]">
        {message.text}
      </p>
    </div>
  );
}