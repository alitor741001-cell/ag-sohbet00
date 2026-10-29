import { useCallback, useMemo, useRef } from 'react';
import VoiceSeat from '@/components/voice/VoiceSeat';

import useMessageProfiles from '@/hooks/useMessageProfiles';
import useSeatCosmetics from '@/hooks/useSeatCosmetics';

import responsiveSeatRows from '@/components/voice/responsiveSeatRows';
import { useSize } from '@/hooks/use-size';

/**
 * Sahnedeki yuvarlak oturma düzeni — satırlar ortalanır. Sayı tahtası açıkken her kişinin altında sayı hücresi durur.
 * Koltuk boyutu ölçülen genişliğe göre seçilir: dar telefonlarda da satır yana taşmaz,
 * geniş ekranlarda koltuklar gereksiz küçülmez.
 */
export default function VoiceSeatGrid({ seats = [], musicOwnerId, userId, ownerId, moderators = [], speakingIds = [], localSpeaking, participantMicStates = {}, localMicMuted, onSelectSeat, boardActive, scores = {}, accent = '#ef4444', gifted = {} }) {
  const wrapRef = useRef(null);
  const profiles = useMessageProfiles(seats.map((seat) => seat?.user_id).filter(Boolean));
  const seatCosmetics = useSeatCosmetics(seats);
  const measured = useSize(wrapRef);
  const width = measured?.width || 360;
  // Koltuk boyutu YALNIZCA koltuk sayısı ve ekran genişliğinden hesaplanır. Sohbet büyüyüp
  // küçülse, sayı tahtası açılsa ya da sahne yeniden ölçülse bile koltuklar yeniden
  // boyutlanmaz: ızgara hep aynı yerde ve aynı boyutta durur.
  const rows = useMemo(() => responsiveSeatRows(seats.length, width), [seats.length, width]);
  const onSeatClick = useCallback((index) => onSelectSeat(index), [onSelectSeat]);

  const featureTop = seats.length === 9;
  const widestRow = Math.max(1, ...rows.map((row) => row.length));
  const narrow = width < 640;
  // Satır içi ve satırlar arası boşluk her düzende aynı kuralla verilir.
  const gap = narrow ? 12 : 20;
  const rowGap = narrow ? 10 : 18;
  const available = width - 4;
  const perSeat = (available - gap * (widestRow - 1)) / widestRow;
  const size = perSeat >= 88 ? 'lg' : perSeat >= 68 ? 'md' : perSeat >= 52 ? 'sm' : 'xs';
  // Üstteki tek çerçeve de aynı boyutta kalır: satır yüksekliği hiç değişmez.
  const topSize = size;

  return (
    <div ref={wrapRef} className="w-full">
      <div className="flex w-full flex-col items-center" style={{ rowGap }}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-col items-center gap-1">
            <div className="flex items-start justify-center" style={{ columnGap: gap }}>
              {row.map((index) => {
                const seat = seats[index];
                const occupied = !!seat?.user_id;
                const micMuted = Boolean(seat?.muted || (occupied && (seat.user_id === userId ? localMicMuted === true : participantMicStates[seat.user_id] === false)));
                const seatSize = featureTop && row.length === 1 ? topSize : size;
                return (
                  <div key={index} data-seat-index={index} className="flex flex-col items-center">
                    <VoiceSeat
                      index={index}
                      seat={seat}
                      profile={occupied ? profiles[seat.user_id] : null}
                      cosmeticChoice={occupied ? seatCosmetics[seat.user_id] : null}
                      musicPlaying={occupied && seat.user_id === musicOwnerId}
                      size={seatSize}
                      fullName={[1, 2, 5].includes(seats.length)}
                      nameSpace={row.length === 1 ? available : ({ xs: 42, sm: 52, md: 68, lg: 88, xl: 96 }[seatSize] + gap - 4)}
                      isSelf={occupied && seat.user_id === userId}
                      isOwner={occupied && seat.user_id === ownerId}
                      isMod={occupied && moderators.includes(seat.user_id)}
                      speaking={occupied && (seat.user_id === userId ? localSpeaking : speakingIds.includes(seat.user_id))}
                      onSelect={onSeatClick}
                      accent={accent}
                      gifted={occupied ? gifted[seat.user_id] : undefined}
                      micMuted={micMuted}
                      boardActive={boardActive}
                      score={occupied ? scores[seat.user_id] || 0 : 0}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}