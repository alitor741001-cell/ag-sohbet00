import React from 'react';

/** Sağ kenardaki beyaz üçgen şerit: tasarımdaki ölçek göstergesi. */
export default function RocketEdgeTicks() {
  return (
    <div aria-hidden="true" className="flex w-3 shrink-0 flex-col items-center justify-center gap-1.5">
      {Array.from({ length: 9 }).map((_, index) => (
        <span key={index} className="rk-tri" />
      ))}
    </div>
  );
}