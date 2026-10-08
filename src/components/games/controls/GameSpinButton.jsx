import React from 'react';
import '@/styles/gameControls.css';
import '@/styles/slot.css';
import SlotMedallionButton from '../slot/SlotMedallionButton';
import { SLOT_BUTTON_ART } from '@/components/games/slotAssets';

/** Slot masasındaki düğme takımı: kanarya AUTO, sağda kartal SPIN — tur sürerken STOP'a döner.
    `extra`: tur madalyonunun soluna yerleşen isteğe bağlı alan (DEDE'de biriken çarpan çemberi). */
export default function GameSpinButton({ spinning, disabled, auto, onSpin, onStop, onAuto, extra }) {
  // Tur sürerken düğme kapanmaz: aynı düğme DURDUR'a döner.
  const off = disabled && !spinning;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <SlotMedallionButton
        art={SLOT_BUTTON_ART.canary}
        label="AUTO"
        size="xs"
        className="slot-auto text-slot"
        active={auto}
        disabled={disabled}
        onClick={onAuto}
        ariaLabel={auto ? 'Otomatik tur açık' : 'Otomatik tur'}
      />

      {extra}

      <SlotMedallionButton
        art={SLOT_BUTTON_ART.eagle}
        label={spinning ? 'STOP' : 'SPIN'}
        size="sm"
        className={`slot-action-ring text-white ${spinning ? 'slot-stop' : 'slot-spin'}`}
        disabled={off}
        onClick={spinning ? onStop : onSpin}
        ariaLabel={spinning ? 'Makaraları durdur' : 'Turu başlat'}
      />
    </div>
  );
}