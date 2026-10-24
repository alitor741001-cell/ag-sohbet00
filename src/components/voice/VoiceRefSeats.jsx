import React from 'react';
import { spot, SEAT_COLS, SEAT_ROWS } from '@/components/voice/refScene';

export default function VoiceRefSeats({ seats, speakingIds, onSelectSeat }) {
  const cells = [];
  SEAT_ROWS.forEach((y, r) => SEAT_COLS.forEach((x, c) => cells.push({ x, y, index: r * 6 + c })));
  return cells.map(({ x, y, index }) => {
    const seat = seats[index];
    const speaking = seat?.user_id && speakingIds?.includes?.(seat.user_id);
    return (
      <button
        key={index}
        type="button"
        aria-label={`Koltuk ${index + 1}`}
        onClick={() => onSelectSeat(index)}
        style={spot(x, y, 50)}
        className="rounded-full"
      >
        {seat?.user_id && (
          <img
            src={seat.avatar}
            alt={seat.name || ''}
            className={`h-full w-full rounded-full object-cover ${speaking ? 'ring-2 ring-green-400' : ''}`}
          />
        )}
      </button>
    );
  });
}