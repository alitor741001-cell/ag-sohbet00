import React from 'react';
import { Coins, LayoutGrid, Plus, Repeat, TrendingUp, Trophy } from 'lucide-react';
import SlotDeckStat from './SlotDeckStat';
import SlotBetStepper from './SlotBetStepper';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

// Yan düğmeler: MAX altın, AUTO yeşil zemin üstünde kendi simgesiyle.
const SIDE_BUTTON =
  'relative flex h-16 w-[4.5rem] shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl text-[10px] font-black tracking-[0.12em] disabled:opacity-50';

/**
 * Oyunun alt kontrol paneli: görselin kendi kontrol alanının yerini alır.
 * Üst şeritte tur bilgileri, ortada coin kasası ve bahis kademesi, altta MAX / AUTO / SPIN durur.
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
    <div className="slot-console slot-rivets relative z-10 shrink-0 border-t-2 border-slot-gold/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-18px_40px_-22px_rgba(0,0,0,0.95)]">
      <span aria-hidden="true" className="slot-bulbs absolute inset-x-0 top-0 h-1.5 opacity-80" />
      <span aria-hidden="true" className="slot-studs absolute inset-x-10 bottom-1 h-1.5 opacity-55" />
      {/* SPIN düğmesinin arkasında makinenin sahne ışığı. */}
      <span aria-hidden="true" className="slot-spotlight pointer-events-none absolute -top-8 right-2 h-28 w-56 opacity-60" />

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2.5">
        <div className="grid grid-cols-3 gap-2">
          <SlotDeckStat icon={LayoutGrid} label="HAT" value={lines} />
          <SlotDeckStat icon={Coins} label="TOPLAM BAHİS" value={bet * lines} />
          <SlotDeckStat icon={Trophy} label="KAZANÇ" value={win} tone={win > 0 ? 'win' : 'muted'} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCoins}
            aria-label="Coin yükle"
            className="slot-metal relative flex h-12 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-full px-3 active:brightness-110"
          >
            <span aria-hidden="true" className="slot-sheen-loop pointer-events-none absolute inset-0 opacity-25" />
            <span className="slot-coin-plus relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-[0_0_12px_rgba(34,197,94,0.6)]">
              <Plus className="h-4 w-4" strokeWidth={3} />
            </span>
            <span className="relative flex min-w-0 flex-col items-start leading-none">
              <span className="text-[8px] font-black uppercase tracking-[0.14em] text-slot-gold/80">COIN</span>
              <span className="slot-digits truncate font-mono text-sm font-black tabular-nums text-white">{format(coins)}</span>
            </span>
          </button>

          <SlotBetStepper bet={bet} disabled={spinning} onStep={onStep} />
        </div>

        <div className="flex items-stretch gap-2">
          <button type="button" onClick={onMax} disabled={!ready} aria-label="Maksimum bahis" className={`slot-max text-white ${SIDE_BUTTON}`}>
            <TrendingUp className="h-4 w-4" strokeWidth={3} />
            MAX
          </button>
          <button
            type="button"
            onClick={onAuto}
            disabled={!ready}
            aria-label="Otomatik tur"
            className={`slot-auto text-slot ${SIDE_BUTTON} ${auto ? 'ring-2 ring-slot-green' : ''}`}
          >
            <Repeat className="h-4 w-4" strokeWidth={3} />
            AUTO
          </button>
          {/* Tur sürerken aynı düğme kırmızı DURDUR düğmesine döner. */}
          <button
            type="button"
            onClick={spinning ? onStop : onSpin}
            disabled={!ready}
            aria-label={spinning ? 'Makaraları durdur' : 'Turu başlat'}
            className={`slot-action-ring relative flex h-16 flex-1 items-center justify-center overflow-hidden rounded-2xl text-lg font-black tracking-[0.18em] text-white disabled:opacity-50 ${
              spinning ? 'slot-stop' : 'slot-spin'
            }`}
          >
            <span aria-hidden="true" className="slot-sheen-loop pointer-events-none absolute inset-0 opacity-35" />
            <span className="relative">{spinning ? 'STOP' : 'SPIN'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}