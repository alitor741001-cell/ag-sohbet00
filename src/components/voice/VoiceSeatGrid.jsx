import { useCallback, useMemo, useRef } from 'react';
import VoiceSeat from '@/components/voice/VoiceSeat';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';
import VoiceBoardTimer from '@/components/voice/VoiceBoardTimer';
import useMessageProfiles from '@/hooks/useMessageProfiles';

import { seatIndexRows } from '@/components/voice/seatLayout';
import { useSize } from '@/hooks/use-size';

// Koltuk hücresi yükseklikleri: portre + isim satırı (sayaç açıkken şerit rozet de eklenir).
const CELL_HEIGHT = { xs: 56, sm: 66, md: 82, lg: 102 };
const SCORE_HEIGHT = 21;
const TIMER_HEIGHT = 34;
// Koltukların altındaki açıklama satırı ve anons şeridi için ayrılan sabit yer.
const FOOTER_SPACE = 48;
const ORDER = ['xs', 'sm', 'md', 'lg'];



/**
 * Sahnedeki yuvarlak oturma düzeni — satırlar ortalanır. Sayı tahtası açıkken her kişinin altında sayı hücresi durur.
 * Koltuk boyutu ölçülen genişliğe göre seçilir: dar telefonlarda da satır yana taşmaz,
 * geniş ekranlarda koltuklar gereksiz küçülmez.
 */
export default function VoiceSeatGrid({ seats = [], musicOwnerId, userId, ownerId, moderators = [], speakingIds = [], localSpeaking, onSelectSeat, boardActive, boardStartedAt, scores = {}, accent = '#ef4444', gifted = {}, stageHeight = 0, keyboardOpen = false }) {
  const wrapRef = useRef(null);
  const measured = useSize(wrapRef);
  const rows = useMemo(() => seatIndexRows(seats.length), [seats.length]);
  const onSeatClick = useCallback((index) => onSelectSeat(index), [onSelectSeat]);
  // Konuşma dalgası rengi kişinin cinsiyetine göre seçilir: profil bilgisi koltuklara iletilir.
  const seatProfiles = useMessageProfiles(seats.map((seat) => seat.user_id).filter(Boolean));

  const widestRow = Math.max(1, ...rows.map((row) => row.length));
  const width = measured?.width || 360;
  const narrow = width < 640;
  const gap = narrow ? 12 : 20;
  const rowGap = narrow ? 12 : 20;
  const available = width - 4;
  const perSeat = (available - gap * (widestRow - 1)) / widestRow;
  // Genişliğe sığan en büyük koltuk boyutu.
  const widthLimit = perSeat >= 110 ? 'lg' : perSeat >= 62 ? 'md' : perSeat >= 52 ? 'sm' : 'xs';
  // Yüksekliğe sığan en büyük koltuk boyutu: koltuk sayısı artınca koltuklar küçülür ama
  // ızgaranın yeri ve satır düzeni değişmez, hiçbir koltuk ya da rakam kesilmez.
  const budget = (stageHeight || 0) - FOOTER_SPACE;
  const lineHeight = (option) => CELL_HEIGHT[option] + (boardActive ? SCORE_HEIGHT : 0);
  const fits = (option) => rows.length * lineHeight(option) + (rows.length - 1) * rowGap + (boardActive ? TIMER_HEIGHT : 0) <= budget;
  const allowed = ORDER.slice(0, ORDER.indexOf(widthLimit) + 1);
  // Klavye açıkken koltuk boyutu değişmez: düzen olduğu yerde kalır.
  const size = keyboardOpen || budget < 120 ? widthLimit : (allowed.slice().reverse().find(fits) || 'xs');

  return (
    <div ref={wrapRef} className="flex w-full flex-col items-center" style={{ rowGap }}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex flex-col items-center gap-1">
          <div className="flex items-start justify-center" style={{ columnGap: gap }}>
          {row.map((index) => {
            const seat = seats[index];
            const occupied = !!seat?.user_id;
            return (
              <div key={index} className="flex flex-col items-center">
                <VoiceSeat
                  index={index}
                  seat={seat}
                  musicPlaying={occupied && seat.user_id === musicOwnerId}
                  size={size}
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
                  <VoiceSeatScore value={occupied ? scores[seat.user_id] || 0 : 0} size={size} />
                )}

              </div>
            );
          })}
          </div>
          {(row.includes(20) || (seats.length < 21 && rowIndex === rows.length - 1)) && (
            <VoiceBoardTimer active={boardActive} startedAt={boardStartedAt} />
          )}
        </div>
      ))}
    </div>
  );
}