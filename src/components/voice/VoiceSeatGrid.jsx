import { useCallback, useMemo, useRef } from 'react';
import VoiceSeat from '@/components/voice/VoiceSeat';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';
import useMessageProfiles from '@/hooks/useMessageProfiles';

import { seatIndexRows } from '@/components/voice/seatLayout';
import { useSize } from '@/hooks/use-size';



/**
 * Sahnedeki yuvarlak oturma düzeni — satırlar ortalanır. Sayı tahtası açıkken her kişinin altında sayı hücresi durur.
 * Koltuk boyutu ölçülen genişliğe göre seçilir: dar telefonlarda da satır yana taşmaz,
 * geniş ekranlarda koltuklar gereksiz küçülmez.
 */
export default function VoiceSeatGrid({ seats = [], musicOwnerId, userId, ownerId, moderators = [], speakingIds = [], localSpeaking, onSelectSeat, boardActive, scores = {}, accent = '#ef4444', gifted = {}, maxHeight }) {
  const wrapRef = useRef(null);
  const measured = useSize(wrapRef);
  const rows = useMemo(() => seatIndexRows(seats.length), [seats.length]);
  const onSeatClick = useCallback((index) => onSelectSeat(index), [onSelectSeat]);
  // Konuşma dalgası rengi kişinin cinsiyetine göre seçilir: profil bilgisi koltuklara iletilir.
  const seatProfiles = useMessageProfiles(seats.map((seat) => seat.user_id).filter(Boolean));

  // 9'lu düzende üstteki tek koltuk (orta çerçeve) referanstaki gibi daha büyük çizilir.
  const featureTop = seats.length === 9;
  // Kalabalık düzen (15/20 koltuk): koltuklar daraltılmaz, geniş kalır.
  const dense = seats.length >= 15;
  const widestRow = Math.max(1, ...rows.map((row) => row.length));
  const width = measured?.width || 360;
  const narrow = width < 640;
  const gap = narrow ? 12 : 20;
  // Alçak ekranda satır araları daralır: en küçük koltukta bile tüm satırlar ve
  // altlarındaki sayı şeritleri sahneye sığar.
  const rowsNeeded = (rows.length || 1) * (boardActive ? 83 : 62) + 12 * Math.max(0, rows.length - 1);
  const rowGap = narrow ? (maxHeight && maxHeight < rowsNeeded ? 6 : 12) : 20;
  const available = width - 4;
  const perSeat = (available - gap * (widestRow - 1)) / widestRow;
  const widthSize = perSeat >= 84 ? 'lg' : perSeat >= 62 ? 'md' : perSeat >= 46 ? 'sm' : 'xs';
  // Yükseklik de hesaba katılır: koltuğun altındaki isim ve (tahta açıkken) sayı şeridi için
  // gereken yer düşülür, kalan yükseklik koltuk boyutunu belirler. Böylece koltuk sayısı
  // artırıldığında alttaki sıraların rakamları görünmez olmaz.
  const SIZES = ['xs', 'sm', 'md', 'lg'];
  const columnExtra = boardActive ? 41 : 20;
  // Üstteki büyük çerçeve fazladan yer kaplar: kalan satırlar ona göre ölçülür.
  const rowUnits = rows.length + (featureTop ? 0.4 : 0);
  const perRow = maxHeight
    ? (maxHeight - rowGap * Math.max(0, rows.length - 1)) / (rowUnits || 1)
    : Infinity;
  const maxCell = perRow - columnExtra;
  const heightSize = maxCell >= 88 ? 'lg' : maxCell >= 68 ? 'md' : maxCell >= 52 ? 'sm' : 'xs';
  const fitSize = SIZES[Math.min(SIZES.indexOf(widthSize), SIZES.indexOf(heightSize))];
  // Kalabalık düzende boyut yükseklik yüzünden kısılmaz: en az 'md' genişlik korunur,
  // sığmayan satırlar sahne içinde kaydırılarak görünür.
  const size = dense
    ? SIZES[Math.min(SIZES.indexOf(widthSize), Math.max(SIZES.indexOf(heightSize), SIZES.indexOf('md')))]
    : fitSize;
  // Orta çerçeve bir beden büyük: referanstaki 9'lu düzenin oranı korunur.
  const topSize = SIZES[Math.min(SIZES.indexOf(size) + 1, SIZES.length - 1)];

  return (
    <div ref={wrapRef} className="flex w-full flex-col items-center" style={{ rowGap }}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex flex-col items-center gap-1">
          <div className="flex items-start justify-center" style={{ columnGap: gap }}>
          {row.map((index) => {
            const seat = seats[index];
            const occupied = !!seat?.user_id;
            const seatSize = featureTop && row.length === 1 ? topSize : size;
            return (
              <div key={index} className="flex flex-col items-center">
                <VoiceSeat
                  index={index}
                  seat={seat}
                  musicPlaying={occupied && seat.user_id === musicOwnerId}
                  size={seatSize}
                  isSelf={occupied && seat.user_id === userId}
                  isOwner={occupied && seat.user_id === ownerId}
                  isMod={occupied && moderators.includes(seat.user_id)}
                  speaking={occupied && (seat.user_id === userId ? localSpeaking : speakingIds.includes(seat.user_id))}
                  gender={occupied ? seatProfiles[seat.user_id]?.gender : ''}
                  onSelect={onSeatClick}
                  accent={accent}
                  gifted={occupied ? gifted[seat.user_id] : undefined}
                  micMuted={!occupied && !!seat?.muted}
                />
                {boardActive && (
                  <VoiceSeatScore value={occupied ? scores[seat.user_id] || 0 : 0} size={seatSize} />
                )}

              </div>
            );
          })}
          </div>
        </div>
      ))}
    </div>
  );
}