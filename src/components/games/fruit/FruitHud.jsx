import React from 'react';
import { Gift, Plus } from 'lucide-react';
import { formatCoins } from './fruitConfig';

/** Bilgi şeridi: coin bakiyem, toplam bahis, tur kazancı, toplam kazanç ve hediye turlar. */
export default function FruitHud({ coins, bet, lines, win, totalWon, onCoins, onFree, freeSpins, freeGrant }) {
  const items = [
    { key: 'coins', label: 'COIN BAKİYEM', value: formatCoins(coins) },
    { key: 'stake', label: 'TOPLAM BAHİS', value: formatCoins(bet * lines) },
    { key: 'win', label: 'KAZANÇ', value: formatCoins(win), win: win > 0 },
    { key: 'total', label: 'TOPLAM', value: formatCoins(totalWon) },
  ];

  return (
    <div className="grid w-full max-w-[26rem] grid-cols-4 gap-1.5">
      {items.map((item) => (
        <div key={item.key} className={`fruit-chip ${item.win ? 'fruit-chip-win' : ''}`}>
          <span className="fruit-chip-label">{item.label}</span>
          <span className="fruit-chip-value">{item.value}</span>
        </div>
      ))}

      <div className="col-span-4 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onCoins}
          aria-label="Coin yükle"
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#f0c46a]/60 bg-black/45 py-1.5 text-[9px] font-black tracking-[0.1em] text-[#ffe9b8] active:brightness-110"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-b from-[#ffe9a8] to-[#c08a12] text-[#2a0c02]">
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          COIN YÜKLE
        </button>

        {/* Hediye: 15 ücretsiz tur verir, turlar kendiliğinden çevrilir. */}
        <button
          type="button"
          onClick={onFree}
          disabled={freeSpins > 0}
          aria-label="Ücretsiz turları al"
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#f0c46a]/60 bg-black/45 py-1.5 text-[9px] font-black tracking-[0.1em] text-[#ffe9b8] active:brightness-110 disabled:opacity-50"
        >
          <Gift className="h-4 w-4" />
          {freeSpins > 0 ? `BEDAVA TUR: ${freeSpins}` : `${freeGrant} ÜCRETSİZ SPİN`}
        </button>
      </div>
    </div>
  );
}