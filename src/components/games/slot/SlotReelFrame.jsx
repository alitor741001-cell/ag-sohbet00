import React from 'react';

export default function SlotReelFrame({ children }) {
  return (
    <div className="slot-frame relative rounded-2xl px-2.5 py-3">
      <div className="slot-bulbs pointer-events-none absolute inset-x-3 top-1 h-1.5" />
      <div className="slot-bulbs pointer-events-none absolute inset-x-3 bottom-1 h-1.5" />
      <div className="slot-bulbs-y pointer-events-none absolute inset-y-3 left-1 w-1.5" />
      <div className="slot-bulbs-y pointer-events-none absolute inset-y-3 right-1 w-1.5" />
      <div className="relative">{children}</div>
    </div>
  );
}