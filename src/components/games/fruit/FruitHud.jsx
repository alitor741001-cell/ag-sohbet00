import React from 'react';
import { Plus } from 'lucide-react';
import { formatCoins } from './fruitConfig';

/** Bilgi şeridi: coin bakiyem, toplam bahis, tur kazancı ve toplam kazanç. */
export default function FruitHud({ coins, bet, lines, win, totalWon, onCoins }) {
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
      <button
        type="button"
        onClick={onCoins}
        aria-label="Coin yükle"
        className="col-span-4 flex items-center justify-center gap-1.5 rounded-2xl border border-white/90 bg-white/70 py-1.5 text-[10px] font-black tracking-[0.14em] text-[#6b2a6d] active:brightness-105"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-b from-[#9beaff] to-[#2f9fd9] text-white">
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        COIN YÜKLE
      </button>
    </div>
  );
}