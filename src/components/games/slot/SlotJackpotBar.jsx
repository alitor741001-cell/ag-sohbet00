import React from 'react';

const JACKPOT_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/39d8edfa4_IMG_0119.jpg';

/** Oyunun üst konsolu: gönderilen jackpot görseli birebir gösterilir. */
export default function SlotJackpotBar({ topGap = 0 }) {
  return (
    <div className="relative shrink-0 bg-black" style={{ paddingTop: `${topGap}px` }}>
      <img src={JACKPOT_IMAGE} alt="Jackpot" className="mx-auto block w-full max-w-2xl" draggable={false} />
    </div>
  );
}