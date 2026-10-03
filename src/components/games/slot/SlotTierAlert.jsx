import React, { useEffect, useRef, useState } from 'react';

/** Bahis kademesi yükseldiğinde üstte beliren kırmızı kademe uyarısı. */
export default function SlotTierAlert({ tier, top = 0 }) {
  const previous = useRef(tier);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (tier === previous.current) return undefined;
    previous.current = tier;
    if (!tier) return undefined;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 3200);
    return () => window.clearTimeout(timer);
  }, [tier]);

  if (!visible || !tier) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-30 flex animate-in justify-center fade-in zoom-in duration-300"
      style={{ top }}
    >
      <span className="rounded-full border border-slot-red/70 bg-black/85 px-5 py-1.5 text-lg font-black tracking-[0.22em] text-slot-red shadow-[0_0_20px_rgba(239,68,68,0.6)]">
        {tier}
      </span>
    </div>
  );
}