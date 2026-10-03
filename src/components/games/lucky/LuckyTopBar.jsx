import React from 'react';
import { CircleHelp, Coins, ScrollText, Settings } from 'lucide-react';
import { BALANCE_BOX, TOP_BUTTONS } from './luckyLayout';
import { formatCoins } from './luckyConfig';

// Görseldeki üç yuvarlak düğme sırayla: kurallar, ödeme tablosu, ayarlar.
const BUTTONS = [
  { sheet: 'help', label: 'Oyun kuralları', Icon: CircleHelp },
  { sheet: 'pay', label: 'Ödeme tablosu', Icon: ScrollText },
  { sheet: 'settings', label: 'Ayarlar', Icon: Settings },
];

/** Görselin üst şeridi: canlı bakiye ve üç yuvarlak düğme. */
export default function LuckyTopBar({ coins, onOpen }) {
  return (
    <>
      <div
        className="absolute flex items-center justify-center gap-1 rounded-full border border-slot-gold/60 bg-black/75 px-1"
        style={{
          left: `${BALANCE_BOX.left}%`,
          top: `${BALANCE_BOX.top}%`,
          width: `${BALANCE_BOX.width}%`,
          height: `${BALANCE_BOX.height}%`,
        }}
      >
        <Coins className="h-[58%] w-auto shrink-0 text-slot-gold" />
        <span className="slot-digits truncate text-[min(3.6vw,0.85rem)] font-black text-white">{formatCoins(coins)}</span>
      </div>

      {BUTTONS.map(({ sheet, label, Icon }, index) => (
        <button
          key={sheet}
          type="button"
          onClick={() => onOpen(sheet)}
          aria-label={label}
          className="absolute flex items-center justify-center rounded-full border border-slot-gold/50 bg-black/55 text-slot-gold"
          style={{
            left: `${TOP_BUTTONS.lefts[index]}%`,
            top: `${TOP_BUTTONS.top}%`,
            width: `${TOP_BUTTONS.size}%`,
            aspectRatio: '1 / 1',
          }}
        >
          <Icon className="h-1/2 w-1/2" />
        </button>
      ))}
    </>
  );
}