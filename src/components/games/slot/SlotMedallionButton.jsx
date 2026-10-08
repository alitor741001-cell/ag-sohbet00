import React from 'react';
import { Image } from '@/components/ui/image';

// Boy kademeleri: küçük yan düğmeler ve büyük tur düğmesi.
const SIZES = {
  xs: { socket: 'p-0.5', button: 'h-10 w-10 gap-0', medal: 'h-5 w-5', text: 'text-[8px]' },
  sm: { socket: 'p-1', button: 'h-14 w-14 gap-0.5', medal: 'h-7 w-7', text: 'text-[8px]' },
  lg: { socket: 'p-1.5', button: 'h-[4.75rem] w-[4.75rem] gap-1', medal: 'h-9 w-9', text: 'text-[10px]' },
};

/** Yuvasına oturan kubbeli düğme: ortasında hayvan madalyonu, altında etiketi. */
export default function SlotMedallionButton({
  art,
  label,
  size = 'sm',
  className = '',
  active,
  disabled,
  onClick,
  ariaLabel,
}) {
  const style = SIZES[size] || SIZES.sm;
  return (
    <span className={`slot-socket flex shrink-0 items-center justify-center rounded-full ${style.socket}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel || label}
        className={`slot-button relative flex flex-col items-center justify-center rounded-full font-black tracking-[0.08em] disabled:opacity-50 ${style.button} ${style.text} ${className} ${active ? 'ring-2 ring-slot-green' : ''}`}
      >
        <span aria-hidden="true" className="slot-button-dome absolute inset-0 rounded-full" />
        <span className={`slot-medallion relative overflow-hidden rounded-full ${style.medal}`}>
          <Image src={art} alt="" className="h-full w-full" fittingType="fill" quality={70} />
        </span>
        <span className="relative leading-none">{label}</span>
      </button>
    </span>
  );
}