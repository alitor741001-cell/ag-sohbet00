import React from 'react';
import { Crown } from 'lucide-react';
import SlotPoolCell from './SlotPoolCell';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

// Aktif bahis kademesinin rengi: kademe yükseldikçe rozet rengi değişir.
const TIER_TONES = {
  MINI: 'text-slot-green',
  BIG: 'text-slot-blue',
  MEGA: 'text-slot-pink',
  'X MEGA': 'text-slot-purple',
};

/** Yandaki küçük havuz rozeti: renkli LED, kısa ad ve canlı değer. */
function PoolChip({ label, value, dot, tone }) {
  return (
    <span className="slot-chip flex items-center gap-1.5 rounded-full px-2 py-0.5">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      <span className={`text-[8px] font-black uppercase leading-none tracking-[0.12em] ${tone}`}>{label}</span>
      <span className="slot-digits font-mono text-[10px] font-black leading-none tabular-nums text-white/95">
        {format(value)}
      </span>
    </span>
  );
}

/**
 * Oyunun üst konsolu: görselin kendi jackpot panelinin yerini alır.
 * Solda markanın taçlı arması ve aktif bahis kademesi, yanda küçük havuzlar,
 * altta üç ana havuz durur. Panelin kenarları perçin ve ampullerle çevrilidir.
 */
export default function SlotJackpotBar({ pools, tier, topGap = 0 }) {
  return (
    // topGap: oyun görselinin altında kalan boşluk panele eklenir, panel makinenin
    // üst kenarına kadar iner ve aradaki siyah şerit kapanır.
    <div
      className="slot-board relative shrink-0 border-b-2 border-slot-gold/60 px-3 pb-3"
      style={{ paddingTop: `${10 + topGap}px` }}
    >
      <span aria-hidden="true" className="slot-rivets absolute inset-x-0 top-0" />

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="slot-metal relative flex items-center gap-1 overflow-hidden rounded-full px-2.5 py-1">
              <Crown className="h-3 w-3 shrink-0 text-slot-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.9)]" />
              <span className="slot-gold-text text-sm font-black leading-none tracking-[0.16em]">AG</span>
              <span aria-hidden="true" className="slot-sheen-loop pointer-events-none absolute inset-0 opacity-40" />
            </span>
            {tier && (
              <span className={`slot-chip rounded-full px-2 py-0.5 text-[8px] font-black uppercase leading-none tracking-[0.12em] ${TIER_TONES[tier]}`}>
                {tier}
              </span>
            )}
          </span>

          <span className="flex items-center gap-1.5">
            <PoolChip label="X MEGA" value={pools?.xmega} dot="bg-slot-pink shadow-[0_0_6px_rgba(255,105,180,0.9)]" tone="text-slot-pink" />
            <PoolChip label="MİNİ" value={pools?.mini} dot="bg-slot-green shadow-[0_0_6px_rgba(34,197,94,0.9)]" tone="text-slot-green" />
          </span>
        </div>

        <div className="flex items-stretch gap-2">
          <SlotPoolCell label="MEGA" value={pools?.mega} tone="text-slot-gold" />
          <SlotPoolCell label="GRAND JACKPOT" value={pools?.jackpot} tone="text-slot-gold" main />
          <SlotPoolCell label="BIG" value={pools?.big} tone="text-slot-blue" />
        </div>
      </div>
    </div>
  );
}