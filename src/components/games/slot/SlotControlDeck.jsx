import React from 'react';
import { Plus } from 'lucide-react';
import SlotDeckStat from './SlotDeckStat';
import SlotBetStepper from './SlotBetStepper';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/**
 * Oyunun alt kontrol paneli: görselin kendi kontrol alanının yerini alır.
 * Üst şeritte tur bilgileri, ortada bakiye ve bahis kademesi, altta MAX / AUTO / SPIN durur.
 */
export default function SlotControlDeck({
  coins,
  bet,
  lines,
  win,
  auto,
  spinning,
  ready,
  onStep,
  onMax,
  onAuto,
  onSpin,
  onStop,
  onCoins,
}) {
  return (
    <div className="relative z-10 shrink-0 border-t border-slot-gold/40 bg-gradient-to-b from-slot-panel via-slot-surface to-slot px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-3.5 shadow-[0_-16px_34px_-20px_rgba(0,0,0,0.95)]">
      {/* Panelin üst kenarında yanan ampul şeridi: makinenin kendi ışığı gibi. */}
      <span aria-hidden="true" className="slot-bulbs absolute inset-x-0 top-0 h-1.5 opacity-80" />

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          <SlotDeckStat label="HAT" value={lines} />
          <SlotDeckStat label="TOPLAM BAHİS" value={bet * lines} />
          <SlotDeckStat label="KAZANÇ" value={win} tone={win > 0 ? 'win' : 'muted'} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCoins}
            aria-label="Coin yükle"
            className="slot-metal flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full px-2.5 active:brightness-110"
          >
            <span className="slot-coin-plus flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="slot-digits truncate font-mono text-sm font-black tabular-nums text-white">{format(coins)}</span>
          </button>

          <SlotBetStepper bet={bet} disabled={spinning} onStep={onStep} />
        </div>

        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={onMax}
            disabled={!ready}
            aria-label="Maksimum bahis"
            className="slot-max h-14 w-16 shrink-0 rounded-2xl text-xs font-black text-white disabled:opacity-50"
          >
            MAX
          </button>
          <button
            type="button"
            onClick={onAuto}
            disabled={!ready}
            aria-label="Otomatik tur"
            className={`slot-auto h-14 w-16 shrink-0 rounded-2xl text-xs font-black text-slot disabled:opacity-50 ${auto ? 'ring-2 ring-slot-green' : ''}`}
          >
            AUTO
          </button>
          {/* Tur sürerken aynı düğme kırmızı DURDUR düğmesine döner. */}
          <button
            type="button"
            onClick={spinning ? onStop : onSpin}
            disabled={!ready}
            aria-label={spinning ? 'Makaraları durdur' : 'Turu başlat'}
            className={`${spinning ? 'slot-stop' : 'slot-spin'} h-14 flex-1 rounded-2xl text-base font-black tracking-[0.14em] text-white disabled:opacity-50`}
          >
            {spinning ? 'STOP' : 'SPIN'}
          </button>
        </div>
      </div>
    </div>
  );
}