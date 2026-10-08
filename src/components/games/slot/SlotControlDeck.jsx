import React from 'react';
import { Coins, LayoutGrid, Plus, Trophy } from 'lucide-react';
import SlotDeckStat from './SlotDeckStat';
import SlotBetStepper from './SlotBetStepper';
import SlotMedallionButton from './SlotMedallionButton';
import FreeSpinBadge from './FreeSpinBadge';
import { SLOT_BUTTON_ART } from '@/components/games/slotAssets';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/**
 * Oyunun alt kontrol masası: fırçalanmış çelik gövde üzerinde tur bilgileri,
 * coin kasası, bahis kademesi ve madalyonlu düğmeler durur.
 * Solda MAX (aslan), sağda FREE rozeti, AUTO (kanarya) ve SPIN (kartal).
 */
export default function SlotControlDeck({
  coins,
  bet,
  lines,
  win,
  freeSpins,
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
      {/* Düğme sırasının arkasında makinenin sahne ışığı. */}
      <span aria-hidden="true" className="slot-spotlight pointer-events-none absolute -top-10 left-1/2 h-28 w-72 -translate-x-1/2 opacity-70" />

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

        {/* Düğme sırası: MAX solda, AUTO ve SPIN sağda. */}
        <div className="flex items-center justify-between gap-3">
          <SlotMedallionButton
            art={SLOT_BUTTON_ART.lion}
            label="MAX"
            className="slot-max text-white"
            disabled={!ready}
            onClick={onMax}
            ariaLabel="Maksimum bahis"
          />
          <span className="flex items-center gap-2.5">
            {/* Ücretsiz çevirme hakkı rozeti AUTO düğmesinin solunda durur. */}
            <FreeSpinBadge count={freeSpins} />
            <SlotMedallionButton
              art={SLOT_BUTTON_ART.canary}
              label="AUTO"
              className="slot-auto text-slot"
              active={auto}
              disabled={!ready}
              onClick={onAuto}
              ariaLabel="Otomatik tur"
            />
            {/* Tur sürerken aynı düğme kırmızı DURDUR düğmesine döner. */}
            <SlotMedallionButton
              art={SLOT_BUTTON_ART.eagle}
              label={spinning ? 'STOP' : 'SPIN'}
              size="lg"
              className={`slot-action-ring text-white ${spinning ? 'slot-stop' : 'slot-spin'}`}
              disabled={!ready}
              onClick={spinning ? onStop : onSpin}
              ariaLabel={spinning ? 'Makaraları durdur' : 'Turu başlat'}
            />
          </span>
        </div>
      </div>
    </div>
  );
}