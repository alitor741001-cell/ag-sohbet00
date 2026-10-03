import React from 'react';

/** SPIN düğmesinin tam üstüne oturan, aynı işçilikte kırmızı STOP düğmesi. */
export default function SlotStopButton() {
  return (
    <span className="slot-stop absolute inset-0 m-auto flex aspect-square w-[108%] items-center justify-center rounded-full">
      {/* Makara dişlisi gibi kesikli altın halka — düğmeye desen verir. */}
      <span aria-hidden="true" className="slot-stop-ring absolute inset-[12%] rounded-full" />
      <span className="relative text-[clamp(0.65rem,3.4vw,1.05rem)] font-black tracking-[0.12em] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
        STOP
      </span>
    </span>
  );
}