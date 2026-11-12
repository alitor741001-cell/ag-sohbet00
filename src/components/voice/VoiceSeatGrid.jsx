import { useCallback, useMemo, useRef } from 'react';
import VoiceSeat from '@/components/voice/VoiceSeat';
import TeamPkArena from '@/components/voice/pk/TeamPkArena';

import useMessageProfiles from '@/hooks/useMessageProfiles';
import useSeatCosmetics from '@/hooks/useSeatCosmetics';

import responsiveSeatRows from '@/components/voice/responsiveSeatRows';
import { useSize } from '@/hooks/use-size';

/**
 * Sahnedeki yuvarlak oturma düzeni — satırlar ortalanır. Sayı tahtası açıkken her kişinin altında sayı hücresi durur.
 * Koltuk boyutu ölçülen genişliğe göre seçilir: dar telefonlarda da satır yana taşmaz,
 * geniş ekranlarda koltuklar gereksiz küçülmez.
 */
export default function VoiceSeatGrid({ seats = [], musicOwnerId, userId, ownerId, moderators = [], speakingIds = [], localSpeaking, participantMicStates = {}, localMicMuted, onSelectSeat, boardActive, scores = {}, accent = '#ef4444', gifted = {}, maxHeight, teamPkFooter = null, teamPkMatch = null }) {
  const wrapRef = useRef(null);
  const profiles = useMessageProfiles(seats.map((seat) => seat?.user_id).filter(Boolean));
  const seatCosmetics = useSeatCosmetics(seats);
  const measured = useSize(wrapRef);
  const width = measured?.width || 360;
  const rows = useMemo(() => responsiveSeatRows(seats.length, width), [seats.length, width]);
  // En kalabalık satır tam genişliğe yayılır; kalan satırlar ortalanır.
  const widestRow = useMemo(() => rows.reduce((max, row) => Math.max(max, row.length), 1), [rows]);
  const onSeatClick = useCallback((index) => onSelectSeat(index), [onSelectSeat]);
  // Satır dizilimi sabit; koltuk boyutu en kalabalık satıra sığacak şekilde seçilir.
  const available = width - 4;
  const gap = widestRow >= 5 ? 2 : 12;
  const seatCell = (available - (widestRow - 1) * gap) / widestRow;
  const size = seatCell >= 84 ? 'lg' : seatCell >= 67 ? 'md' : seatCell >= 48 ? 'sm' : 'xs';
  const topSize = size;
  const featureTop = seats.length === 13;
  const rowGap = 12;
  const cellHeight = { xs: 42, sm: 52, md: 68, lg: 88 }[size];
  // Boş/dolu koltuk aynı alanı ayırır; katılım ve isim yüklenmesi satırı oynatmaz.
  const rowHeight = cellHeight + (boardActive ? 34 : 22);

  // Normal PK düzeni: ortada sunucu, solda mavi, sağda kırmızı 4'er koltuk; her koltukta sayı şeridi.
  if (teamPkFooter && seats.length === 9) {
    const renderSeat = (index, seatSize, space) => {
      const seat = seats[index];
      const occupied = !!seat?.user_id;
      const micMuted = Boolean(seat?.muted || (occupied && (seat.user_id === userId ? localMicMuted === true : participantMicStates[seat.user_id] === false)));
      return (
        <div key={index} data-seat-index={index} className="flex flex-col items-center" style={{ minHeight: ({ xs: 42, sm: 52, md: 68, lg: 88 }[seatSize] || 68) + 34 }}>
          <VoiceSeat
            index={index}
            seat={seat}
            profile={occupied ? profiles[seat.user_id] : null}
            cosmeticChoice={occupied ? seatCosmetics[seat.user_id] : null}
            musicPlaying={occupied && seat.user_id === musicOwnerId}
            size={seatSize}
            nameSpace={space}
            isSelf={occupied && seat.user_id === userId}
            isOwner={occupied && seat.user_id === ownerId}
            isMod={occupied && moderators.includes(seat.user_id)}
            speaking={occupied && (seat.user_id === userId ? localSpeaking : speakingIds.includes(seat.user_id))}
            onSelect={onSeatClick}
            accent={accent}
            gifted={occupied ? gifted[seat.user_id] : undefined}
            micMuted={micMuted}
            boardActive
            score={occupied ? scores[seat.user_id] || 0 : 0}
          />
        </div>
      );
    };
    return (
      <div ref={wrapRef} className="w-full">
        <TeamPkArena seats={seats} renderSeat={renderSeat} onSelectSeat={onSeatClick} footer={teamPkFooter} width={width} />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="w-full">
      <div className="flex w-full flex-col items-center" style={{ rowGap }}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex w-full flex-col gap-1">
            <div className={`flex w-full items-start ${row.length >= 3 && row.length === widestRow ? 'justify-between' : 'justify-center'}`} style={{ columnGap: gap, minHeight: rowHeight }}>
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
      {/* Normal PK açıkken "Başlat" barı her koltuk sayısında görünür. */}
      {teamPkFooter}
    </div>
  );
}