import { useCallback, useMemo, useRef } from 'react';
import VoiceSeat from '@/components/voice/VoiceSeat';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useSeatCosmetics from '@/hooks/useSeatCosmetics';

import responsiveSeatRows from '@/components/voice/responsiveSeatRows';
import { useSize } from '@/hooks/use-size';

/**
 * Sahnedeki yuvarlak oturma düzeni — satırlar ortalanır. Sayı tahtası açıkken her kişinin altında sayı hücresi durur.
 * Koltuk boyutu ölçülen genişliğe göre seçilir: dar telefonlarda da satır yana taşmaz,
 * geniş ekranlarda koltuklar gereksiz küçülmez.
 */
export default function VoiceSeatGrid({ seats = [], musicOwnerId, userId, ownerId, moderators = [], speakingIds = [], localSpeaking, participantMicStates = {}, localMicMuted, onSelectSeat, boardActive, scores = {}, accent = '#ef4444', gifted = {}, maxHeight }) {
  const wrapRef = useRef(null);
  const profiles = useMessageProfiles(seats.map((seat) => seat?.user_id).filter(Boolean));
  const seatCosmetics = useSeatCosmetics(seats);
  const measured = useSize(wrapRef);
  const width = measured?.width || 360;
  const rows = useMemo(() => responsiveSeatRows(seats.length, width), [seats.length, width]);
  const onSeatClick = useCallback((index) => onSelectSeat(index), [onSelectSeat]);

  // 9'lu düzende üstteki tek koltuk (orta çerçeve) referanstaki gibi daha büyük çizilir.
  const featureTop = seats.length === 9;
  // Kalabalık düzen (15/20 koltuk): koltuklar daraltılmaz, geniş kalır.
  const dense = seats.length >= 15;
  // Kalabalık odalarda satırlar ekran genişliğine göre yeniden bölünür.
  const many = seats.length >= 20;
  const widestRow = Math.max(1, ...rows.map((row) => row.length));
  const narrow = width < 640;
  const baseGap = featureTop ? (narrow ? 6 : 14) : narrow ? (many ? 8 : 12) : 20;
  // Alçak ekranda satır araları daralır: en küçük koltukta bile tüm satırlar ve
  // altlarındaki sayı şeritleri sahneye sığar.
  const rowsNeeded = (rows.length || 1) * (boardActive ? 83 : 62) + 12 * Math.max(0, rows.length - 1);
  const rowGap = (featureTop ? (narrow ? 8 : 14) : narrow ? (many ? 5 : maxHeight && maxHeight < rowsNeeded ? 6 : 12) : 20);
  const available = width - 4;
  const perSeat = (available - baseGap * (widestRow - 1)) / widestRow;
  // 9'lu düzende koltuk bir beden büyük çizilir: 'xl' sınırı da açıktır.
  const widthSize = featureTop
    ? (perSeat >= 96 ? 'xl' : perSeat >= 88 ? 'lg' : perSeat >= 68 ? 'md' : perSeat >= 52 ? 'sm' : 'xs')
    : (perSeat >= 88 ? 'lg' : perSeat >= 68 ? 'md' : perSeat >= 52 ? 'sm' : 'xs');
  const gap = baseGap;
  // Yükseklik de hesaba katılır: koltuğun altındaki isim ve (tahta açıkken) sayı şeridi için
  // gereken yer düşülür, kalan yükseklik koltuk boyutunu belirler.
  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];
  const columnExtra = boardActive ? (featureTop ? 33 : many ? 36 : 41) : featureTop ? 16 : 20;
  // Üstteki büyük çerçeve fazladan yer kaplar: kalan satırlar ona göre ölçülür.
  const rowUnits = rows.length + (featureTop ? 0.2 : 0);
  const perRow = maxHeight
    ? (maxHeight - rowGap * Math.max(0, rows.length - 1)) / (rowUnits || 1)
    : Infinity;
  const maxCell = perRow - columnExtra;
  const heightSize = featureTop
    ? (maxCell >= 96 ? 'xl' : maxCell >= 86 ? 'lg' : maxCell >= 66 ? 'md' : maxCell >= 50 ? 'sm' : 'xs')
    : (maxCell >= 88 ? 'lg' : maxCell >= 68 ? 'md' : maxCell >= 52 ? 'sm' : 'xs');
  const fitSize = SIZES[Math.min(SIZES.indexOf(widthSize), SIZES.indexOf(heightSize))];
  // Kalabalık odalarda hem genişlik hem yükseklik sınırı uygulanır;
  // sığmayan satırlar üst sahnenin dikey kaydırma alanında erişilebilir kalır.
  const manySize = SIZES[Math.min(SIZES.indexOf(widthSize), SIZES.indexOf(heightSize), SIZES.indexOf(narrow ? 'sm' : 'md'))];
  const denseFloor = 'md';
  const size = dense
    ? (many ? manySize : SIZES[Math.min(SIZES.indexOf(widthSize), Math.max(SIZES.indexOf(heightSize), SIZES.indexOf(denseFloor)))])
    : featureTop
      ? widthSize
      : fitSize;
  // Orta çerçeve bir beden büyük: referanstaki 9'lu düzenin oranı korunur.
  const topSize = SIZES[Math.min(SIZES.indexOf(size) + 1, SIZES.length - 1)];

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
                      isSelf={occupied && seat.user_id === userId}
                      isOwner={occupied && seat.user_id === ownerId}
                      isMod={occupied && moderators.includes(seat.user_id)}
                      speaking={occupied && (seat.user_id === userId ? localSpeaking : speakingIds.includes(seat.user_id))}
                      onSelect={onSeatClick}
                      accent={accent}
                      gifted={occupied ? gifted[seat.user_id] : undefined}
                      micMuted={micMuted}
                    />
                    {boardActive && occupied && (
                      <VoiceSeatScore value={scores[seat.user_id] || 0} size={seatSize} />
                    )}
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