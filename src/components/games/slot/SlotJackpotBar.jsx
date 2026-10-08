import React from 'react';
import SlotPoolCell from './SlotPoolCell';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

// Aktif bahis kademesinin rengi: kademe yükseldikçe rozet rengi değişir.
const TIER_TONES = {
  MINI: 'border-slot-green/60 text-slot-green',
  BIG: 'border-slot-blue/60 text-slot-blue',
  MEGA: 'border-slot-pink/60 text-slot-pink',
  'X MEGA': 'border-slot-purple/60 text-slot-purple',
};

const CHIP = 'flex items-center gap-1.5 rounded-full border border-slot-gold/25 bg-black/40 px-2 py-0.5';

/**
 * Oyunun üst konsolu: görselin kendi jackpot panelinin yerini alır.
 * Solda markanın arması ve aktif bahis kademesi, yanda küçük havuzlar,
 * altta üç ana havuz durur.
 */
export default function SlotJackpotBar({ pools, tier }) {
  return (
    <div className="relative border-b border-slot-gold/40 bg-gradient-to-b from-slot-surface via-slot-panel to-slot px-3 pb-3 pt-2">
      {/* Konsolun alt kenarında yanan ampul şeridi: makinenin kendi ışığı gibi. */}
      <span aria-hidden="true" className="slot-bulbs absolute inset-x-0 bottom-0 h-1.5 opacity-80" />

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="slot-metal flex items-center rounded-full px-2.5 py-0.5">
              <span className="slot-gold-text text-sm font-black leading-none tracking-[0.14em]">AG</span>
            </span>
            {tier && (
              <span className={`rounded-full border bg-black/60 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] ${TIER_TONES[tier]}`}>
                {tier}
              </span>
            )}
          </span>

          <span className="flex items-center gap-1.5">
            <span className={CHIP}>
              <span className="text-[8px] font-black uppercase tracking-[0.08em] text-slot-pink">X MEGA</span>
              <span className="slot-digits font-mono text-[10px] font-black tabular-nums text-white/95">{format(pools?.xmega)}</span>
            </span>
            <span className={CHIP}>
              <span className="text-[8px] font-black uppercase tracking-[0.08em] text-slot-green">MİNİ</span>
              <span className="slot-digits font-mono text-[10px] font-black tabular-nums text-white/95">{format(pools?.mini)}</span>
            </span>
          </span>
        </div>

        <div className="flex items-stretch gap-2">
          <SlotPoolCell label="MEGA" value={pools?.mega} tone="text-slot-gold" />
          <SlotPoolCell label="GRAND" value={pools?.jackpot} tone="text-slot-gold" main />
          <SlotPoolCell label="BIG" value={pools?.big} tone="text-slot-blue" />
        </div>
      </div>
    </div>
  );
}