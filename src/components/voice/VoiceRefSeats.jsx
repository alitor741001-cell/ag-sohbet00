import React from 'react';
import { Lock } from 'lucide-react';
import { spot, SEAT_COLS, SEAT_ROWS } from '@/components/voice/refScene';

// Koltuklar temadan bağımsız, kendi çizimiyle gösterilir.
export default function VoiceRefSeats({ seats, speakingIds, onSelectSeat }) {
  const cells = [];
  SEAT_ROWS.forEach((y, r) => SEAT_COLS.forEach((x, c) => cells.push({ x, y, index: r * 6 + c })));
  return cells.map(({ x, y, index }) => {
    const seat = seats[index];
    const taken = !!seat?.user_id;
    const speaking = taken && speakingIds?.includes?.(seat.user_id);
    const scale = seat?.frame_scale || 1.45;
    return (
      <button
        key={index}
        type="button"
        aria-label={`Koltuk ${index + 1}`}
        onClick={() => onSelectSeat(index)}
        style={spot(x, y, 50, 72)}
        className="flex flex-col items-center"
      >
        <span className={`relative aspect-square w-full rounded-full border-2 bg-black/50 ${speaking ? 'border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.9)]' : 'border-white/40'}`}>
          {taken ? (
            <img src={seat.avatar} alt={seat.name || ''} className="h-full w-full rounded-full object-cover" />
          ) : seat?.locked ? (
            <Lock className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white/60" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white/60">{index + 1}</span>
          )}
          {taken && seat.frame && (
            <img
              src={seat.frame}
              alt=""
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
              style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
            />
          )}
        </span>
        <span className="mt-0.5 w-full truncate text-center text-[9px] font-semibold text-white">{taken ? seat.name : ''}</span>
      </button>
    );
  });
}