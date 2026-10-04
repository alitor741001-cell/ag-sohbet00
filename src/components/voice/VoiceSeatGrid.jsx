import { useEffect, useRef, useState } from 'react';
import VoiceSeat from '@/components/voice/VoiceSeat';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';
import VoiceSeatTimer from '@/components/voice/VoiceSeatTimer';
import { seatIndexRows } from '@/components/voice/seatLayout';
import { useSize } from '@/hooks/use-size';

// Süre sayacı yalnızca bu numaralı koltukların hemen altında görünür (21 ve 22).
const TIMER_SEATS = [21, 22];

/**
 * Sahnedeki yuvarlak oturma düzeni — satırlar ortalanır. Sayı tahtası açıkken her kişinin altında sayı hücresi durur.
 * Koltuk boyutu ölçülen genişliğe göre seçilir: dar telefonlarda da satır yana taşmaz,
 * geniş ekranlarda koltuklar gereksiz küçülmez.
 */
export default function VoiceSeatGrid({ seats = [], userId, ownerId, moderators = [], speakingIds = [], localSpeaking, onSelectSeat, boardActive, startedAt = '', scores = {}, accent = '#ef4444', gifted = {} }) {
  const wrapRef = useRef(null);
  const measured = useSize(wrapRef);
  const rows = seatIndexRows(seats.length);
  // Süre sayacı: sayaç açıldığı andan bu yana geçen saniye, her saniye kendiliğinden ilerler.
  const startedMs = startedAt ? new Date(startedAt).getTime() : 0;
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!boardActive || !startedMs) { setElapsed(0); return undefined; }
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedMs) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [boardActive, startedMs]);
  const widestRow = Math.max(1, ...rows.map((row) => row.length));
  const gap = measured && measured.width < 640 ? 12 : 20;
  const available = (measured?.width || 360) - 4;
  const perSeat = (available - gap * (widestRow - 1)) / widestRow;
  const size = perSeat >= 110 ? 'lg' : perSeat >= 62 ? 'md' : perSeat >= 52 ? 'sm' : 'xs';

  return (
    <div ref={wrapRef} className="flex w-full flex-col items-center gap-4 sm:gap-5">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex items-start justify-center gap-3 sm:gap-5">
          {row.map((index) => {
            const seat = seats[index];
            const occupied = !!seat?.user_id;
            return (
              <div key={index} className="flex flex-col items-center">
                <VoiceSeat
                  index={index}
                  seat={seat}
                  size={size}
                  isSelf={occupied && seat.user_id === userId}
                  isOwner={occupied && seat.user_id === ownerId}
                  isMod={occupied && moderators.includes(seat.user_id)}
                  speaking={occupied && (seat.user_id === userId ? localSpeaking : speakingIds.includes(seat.user_id))}
                  onClick={() => onSelectSeat(index)}
                  accent={accent}
                  gifted={occupied ? gifted[seat.user_id] : undefined}
                  micMuted={!occupied && !!seat?.muted}
                />
                {boardActive && (
                  <VoiceSeatScore value={occupied ? scores[seat.user_id] || 0 : 0} size={size} />
                )}
                {boardActive && TIMER_SEATS.includes(index + 1) && startedMs > 0 && (
                  <VoiceSeatTimer seconds={elapsed} size={size} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}