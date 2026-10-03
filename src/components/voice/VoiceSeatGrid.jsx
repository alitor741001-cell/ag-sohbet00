import VoiceSeat from '@/components/voice/VoiceSeat';
import { seatIndexRows } from '@/components/voice/seatLayout';

/** Sahnedeki yuvarlak oturma düzeni — satırlar ortalanır. */
export default function VoiceSeatGrid({ seats = [], userId, ownerId, moderators = [], speakingIds = [], localSpeaking, onSelectSeat }) {
  const size = seats.length > 15 ? 'sm' : 'md';
  return (
    <div className="flex flex-col items-center gap-4 sm:gap-5">
      {seatIndexRows(seats.length).map((row, rowIndex) => (
        <div key={rowIndex} className="flex items-start justify-center gap-3 sm:gap-5">
          {row.map((index) => {
            const seat = seats[index];
            const occupied = !!seat?.user_id;
            return (
              <VoiceSeat
                key={index}
                index={index}
                seat={seat}
                size={size}
                isSelf={occupied && seat.user_id === userId}
                isOwner={occupied && seat.user_id === ownerId}
                isMod={occupied && moderators.includes(seat.user_id)}
                speaking={occupied && (seat.user_id === userId ? localSpeaking : speakingIds.includes(seat.user_id))}
                onClick={() => onSelectSeat(index)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}