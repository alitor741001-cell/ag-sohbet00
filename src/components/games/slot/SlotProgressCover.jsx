import React from 'react';
import { SLOT_PROGRESS_TEXT } from './slotLayout';

/**
 * Görselde basılı "2/20" yazısı canlı bir değere karşılık gelmiyor: kapsülün kendi
 * zemin rengiyle kapatılır, geriye temiz bir ilerleme çubuğu kalır.
 */
export default function SlotProgressCover() {
  return (
    <span
      aria-hidden="true"
      className="absolute"
      style={{ ...SLOT_PROGRESS_TEXT.box, backgroundColor: SLOT_PROGRESS_TEXT.skin }}
    />
  );
}