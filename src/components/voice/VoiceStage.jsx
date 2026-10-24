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
  const areaMeasured = useSize(areaRef);
  // Klavye açıldığında sahne kısalır; koltuk boyutu bu kısalıktan etkilenmesin diye
  // son "klavye kapalı" yükseklik sabit tutulur (24/30 koltuk düzeni).
  const steadyHeight = useRef(0);
  const keyboardOpen = areaRef.current?.closest?.('.voice-viewport')?.dataset.keyboard === 'open';
  if (!keyboardOpen && areaMeasured?.height) steadyHeight.current = areaMeasured.height;
  const gridMaxHeight = keyboardOpen && steadyHeight.current ? steadyHeight.current : areaMeasured?.height;
  // Kalabalık düzende (15/20 koltuk) satırlar sahneye sığmazsa sahne kendi içinde kayar.
  const total = grid.seats?.length || 0;
  const dense = total >= 15;
  // 30 mikrofon: koltuklar küçülerek ekrana sığar, sahne kaymaz — düzen sabit durur.
  const many = total >= 20;
  // 9'lu düzende koltuklar sahnenin iki kenarına yanaşır: yan boşluk kısalır.
  const nine = total === 9;
  // Sahne yalnızca içerik gerçekten sığmadığında kaydırılır; sığdığında kaydırma yoktur,
  // böylece koltuklar aşağı yukarı oynamaz.
  const fitsStage = (gridMeasured?.height || 0) <= (areaMeasured?.height || 0) + 1;
  const scrollable = nine || (dense && !many) || !fitsStage;

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
    return () => {
      frame.style.removeProperty('--voice-seat-free');
      frame.style.removeProperty('--voice-board-lift');
    };
  }, [measured?.height, gridMeasured?.height, grid.seats?.length, grid.boardActive, room?.password]);

  return (
    <>
      <div
        ref={scrollRef}
        {...handlers}
        // Sayı tahtası açıkken süre kartı koltukların hemen altına oturur; sahnenin alt boşluğu
        // ona devredilir, koltuklar için ayrılan yer değişmez.
        className={`voice-stage relative min-h-0 flex-1 ${nine ? 'px-1' : 'px-3'} pt-4 ${scrollable ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'} ${grid.boardActive ? 'pb-0' : 'pb-4'}`}
      >
        <div ref={boxRef} className="flex h-full min-h-0 flex-col items-center">
          {room?.password && (
            <p className="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-amber-400">
              <Lock className="h-3 w-3" /> Şifreli oda
            </p>
          )}
          {/* Koltuk ızgarasına kalan alan ölçülür: satırlar bu yüksekliğe sığacak boyutta çizilir,
              böylece alttaki koltukların rakam şeritleri kırpılmaz. */}
          <div ref={areaRef} className="flex w-full min-h-0 flex-1 flex-col items-center">
            <div ref={gridBoxRef} className="flex w-full flex-col items-center">
              <VoiceSeatGrid {...grid} maxHeight={gridMaxHeight} />
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