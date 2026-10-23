import { useCallback } from 'react';
import VoiceSeat from '@/components/voice/VoiceSeat';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';
import useSeatCosmetics from '@/hooks/useSeatCosmetics';

/** Tasarımdaki gibi 6 sütunlu koltuk düzeni. */
export default function VoiceSeatGrid({ seats = [], userId, ownerId, moderators = [], speakingIds = [], localSpeaking, participantMicStates = {}, localMicMuted, onSelectSeat, boardActive, scores = {}, accent = '#ef4444', gifted = {} }) {
  const seatCosmetics = useSeatCosmetics(seats);
  const onSeatClick = useCallback((index) => onSelectSeat(index), [onSelectSeat]);

  return (
    <div className="grid w-full grid-cols-6 gap-x-0 gap-y-1">
      {seats.map((seat, index) => {
        const occupied = !!seat?.user_id;
        const micMuted = Boolean(seat?.muted || (occupied && (seat.user_id === userId ? localMicMuted === true : participantMicStates[seat.user_id] === false)));
        return (
          <div key={index} className="flex flex-col items-center">
            <VoiceSeat
              index={index}
              seat={seat}
              cosmeticChoice={occupied ? seatCosmetics[seat.user_id] : null}
              isOwner={occupied && seat.user_id === ownerId}
              isMod={occupied && moderators.includes(seat.user_id)}
              speaking={occupied && (seat.user_id === userId ? localSpeaking : speakingIds.includes(seat.user_id))}
              onSelect={onSeatClick}
              accent={accent}
              gifted={occupied ? gifted[seat.user_id] : undefined}
              micMuted={micMuted}
            />
            {boardActive && <VoiceSeatScore value={occupied ? scores[seat.user_id] || 0 : 0} size="sm" />}
          </div>
        );
      })}
    </div>
  );
}