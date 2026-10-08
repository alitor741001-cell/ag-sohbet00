import React from 'react';
import { SLOT_ART } from '../slotAssets';
import { ART_HEIGHT, ART_WIDTH, SLOT_TITLE } from './slotLayout';

/**
 * Görselde basılı oyun adı ("filmkeyfi") kapatılır ve yerine AG yazılır.
 * Kapak, görselin aynı bölgesinin bulanık kopyasıdır: arka plandaki gece/gökyüzü
 * dokusuyla bütünleşir, kapatılan yazıdan iz kalmaz.
 */
export default function SlotTitle({ scale = 0 }) {
  const { box, x, y, w, h } = SLOT_TITLE;
  const fontSize = Math.min(h * 0.82, (w * 0.62) / 2) * (scale || 0);

  return (
    <span className="absolute overflow-hidden" style={box}>
      <span
        aria-hidden="true"
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${SLOT_ART.shell})`,
          backgroundSize: `${((ART_WIDTH / w) * 100).toFixed(2)}% ${((ART_HEIGHT / h) * 100).toFixed(2)}%`,
          backgroundPosition: `${((x / (ART_WIDTH - w)) * 100).toFixed(2)}% ${((y / (ART_HEIGHT - h)) * 100).toFixed(2)}%`,
          filter: 'blur(12px) brightness(0.72) saturate(0.85)',
        }}
      />
      <span className="absolute inset-0 bg-slot/35" />
      <span
        className="slot-logo-3d relative flex h-full w-full items-center justify-center font-black leading-none tracking-[0.12em]"
        style={{ fontSize: `${fontSize.toFixed(2)}px` }}
      >
        AG
      </span>
    </span>
  );
}