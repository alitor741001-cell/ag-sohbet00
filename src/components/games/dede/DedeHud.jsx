import React from 'react';
import { Gift, Plus } from 'lucide-react';
import { formatCoins } from './dedeConfig';

/** Bilgi şeridi: coin bakiyem, toplam bahis, tur kazancı, toplam kazanç ve çevirme hakkı. */
export default function DedeHud({ coins, bet, lines, win, totalWon, onCoins, onSession, sessionPrice, sessionSpins, freeSpins }) {
  const items = [
    { key: 'coins', label: 'COIN BAKİYEM', value: formatCoins(coins) },
    { key: 'stake', label: 'TOPLAM BAHİS', value: formatCoins(bet * lines) },
    { key: 'win', label: 'KAZANÇ', value: formatCoins(win), win: win > 0 },
    { key: 'total', label: 'TOPLAM', value: formatCoins(totalWon) },
  ];
  const active = (freeSpins ?? 0) > 0;

  return (
    <div className="grid w-full max-w-[26rem] grid-cols-4 gap-1.5">
      {items.map((item) => (
        <div key={item.key} className={`dede-chip ${item.win ? 'dede-chip-win' : ''}`}>
          <span className="dede-chip-label">{item.label}</span>
          <span className="dede-chip-value">{item.value}</span>
        </div>
      ))}

      <div className="col-span-4 grid grid-cols-2 gap-1.5">
        {/* Sol taraf: bedeli coinlerden düşülen 15 çevirme hakkı; turlar kendiliğinden çevrilir. */}
        <button
          type="button"
          onClick={onSession}
          disabled={active}
          aria-label="Çevirme hakkı al"
          className="flex flex-col items-center justify-center rounded-2xl border border-[#ffd35c]/70 bg-gradient-to-b from-[#3a1258] to-[#1a0626] px-1 py-1 active:brightness-110 disabled:opacity-55"
        >
          <span className="flex items-center gap-1 text-[9px] font-black tracking-[0.06em] text-[#ffe9a8]">
            <Gift className="h-3.5 w-3.5" />
            {active ? `ÇEVRİLİYOR · ${freeSpins}` : `${sessionSpins} ÇEVİRME HAKKI`}
          </span>
          <span className="text-[10px] font-black text-[#ffd35c]">{formatCoins(sessionPrice)} COIN</span>
        </button>

        <button
          type="button"
          onClick={onCoins}
          aria-label="Coin yükle"
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#ffd35c]/60 bg-black/45 py-1.5 text-[9px] font-black tracking-[0.1em] text-[#ffe9a8] active:brightness-110"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-b from-[#ffe9a8] to-[#c08a12] text-[#2a0c02]">
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          COIN YÜKLE
        </button>
      </div>
    </div>
  );
}