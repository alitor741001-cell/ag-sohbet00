import { useLayoutEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import VoiceSeatGrid from '@/components/voice/VoiceSeatGrid';
import VoiceBoardTimer from '@/components/voice/VoiceBoardTimer';
import HiddenUserMarquee from '@/components/voice/HiddenUserMarquee';
import { useSize } from '@/hooks/use-size';
import VipRoomEntrance from '@/components/vip/VipRoomEntrance';

/**
 * Sahne: üst başlık ile alt sohbet alanı arasında kalan sabit bölge.
 * Koltuklar bu bölgenin tepesine demirlenir; sohbet açılıp kapansa, yeni mesaj gelse ya da
 * koltuk sayısı değişse bile bu alanın yüksekliği değişmez, dolayısıyla koltuklar oynamaz.
 * Sayı tahtası süresi koltukların hemen altında durur (ölçülen boşluk kadar yukarı taşınır) ve
 * sahnenin dışında kaldığı için kırpılmaz, her koltuk düzeninde görünür.
 */
export default function VoiceStage({ scrollRef, handlers, room, hiddenAnnounce, grid }) {
  const boxRef = useRef(null);
  const gridBoxRef = useRef(null);
  const areaRef = useRef(null);
  const measured = useSize(boxRef);
  const gridMeasured = useSize(gridBoxRef);
  // Sahne hiçbir düzende kaymaz ve kırpılmaz: koltuklar sabit durur, temanın üstünde görünür.

  // Koltukların altında kalan boşluk sohbet alanına bildirilir: mesajlar tam koltukların alt
  // hizasından başlar. Koltukların boyutu ve yeri değişmez — yalnızca sohbet yukarı taşar.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const gridBox = gridBoxRef.current;
    const frame = box?.closest('.voice-viewport');
    if (!box || !gridBox || !frame) return undefined;
    const free = Math.max(0, Math.round(box.getBoundingClientRect().bottom - gridBox.getBoundingClientRect().bottom));
    frame.style.setProperty('--voice-seat-free', `${free}px`);
    // "Devam Ediyor" kartı koltukların hemen altına çekilir: koltuk sayısı ne olursa olsun
    // kart son satırın (sayı şeritlerinin) altında durur. Kart kendi yerleşiminde kalır,
    // yalnızca yukarı taşınır — koltukların yeri ve boyutu değişmez.
    frame.style.setProperty('--voice-board-lift', `${free}px`);
    // Taşan son satırda da sayaç numaraların altından başlasın.
    const timerOffset = gridBox.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom;
    frame.style.setProperty('--voice-board-offset', `${timerOffset}px`);
    return () => {
      frame.style.removeProperty('--voice-seat-free');
      frame.style.removeProperty('--voice-board-lift');
      frame.style.removeProperty('--voice-board-offset');
    };
  }, [measured?.height, gridMeasured?.height, grid.seats?.length, grid.boardActive, room?.password]);

  return (
    <>
      <div
        ref={scrollRef}
        {...handlers}
        // Sayı tahtası açıkken süre kartı koltukların hemen altına oturur; sahnenin alt boşluğu
        // ona devredilir, koltuklar için ayrılan yer değişmez.
        className={`voice-stage relative z-20 min-h-0 flex-1 px-3 pt-4 overflow-visible ${grid.boardActive ? 'pb-0' : 'pb-4'}`}
      >
        <div ref={boxRef} className="flex h-full min-h-0 flex-col items-center">
          {room?.password && (
            <p className="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-amber-400">
              <Lock className="h-3 w-3" /> Şifreli oda
            </p>
          )}
          {/* Koltuk ızgarası sahnenin tepesine demirlenir: boyutu yalnızca koltuk sayısı ve
              ekran genişliğine bağlıdır, ölçüme göre yeniden boyutlanmaz. */}
          <div ref={areaRef} className="flex w-full min-h-0 flex-1 flex-col items-center">
            <div ref={gridBoxRef} className="flex w-full flex-col items-center">
              <VoiceSeatGrid {...grid} />
            </div>
          </div>
          <HiddenUserMarquee active={hiddenAnnounce.active} name={hiddenAnnounce.name} />
        </div>
      </div>
      <VoiceBoardTimer active={grid.boardActive} startedAt={grid.boardStartedAt} />
      <div className="pointer-events-none relative z-20 h-0 shrink-0" style={{ top: 'calc(-1 * var(--voice-board-lift, 0px))' }}>
        <VipRoomEntrance roomId={room?.id} inline />
      </div>
    </>
  );
}