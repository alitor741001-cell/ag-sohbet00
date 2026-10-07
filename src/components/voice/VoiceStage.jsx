import { useLayoutEffect, useRef } from 'react';
import { Gift, Lock } from 'lucide-react';
import VoiceSeatGrid from '@/components/voice/VoiceSeatGrid';
import HiddenUserMarquee from '@/components/voice/HiddenUserMarquee';
import { useSize } from '@/hooks/use-size';

/**
 * Sahne: üst başlık ile alt sohbet alanı arasında kalan sabit bölge.
 * Koltuklar bu bölgenin tepesine demirlenir; sohbet açılıp kapansa, yeni mesaj gelse ya da
 * koltuk sayısı değişse bile bu alanın yüksekliği değişmez, dolayısıyla koltuklar oynamaz.
 * Ölçülen yükseklik koltuk ızgarasına verilir: ızgara kendini bu alana sığdıracak boyutu seçer,
 * böylece her telefonda tüm koltuklar ve koltuk altı rakamlar tamamen görünür.
 */
export default function VoiceStage({ scrollRef, handlers, room, selectedCount, seatAccent, onClearSelection, hiddenAnnounce, keyboardOpen, grid }) {
  const boxRef = useRef(null);
  const gridBoxRef = useRef(null);
  const measured = useSize(boxRef);
  const gridMeasured = useSize(gridBoxRef);

  // Koltukların altında kalan boşluk sohbet alanına bildirilir: mesajlar tam koltukların alt
  // hizasından başlar. Koltukların boyutu ve yeri değişmez — yalnızca sohbet yukarı taşar.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const gridBox = gridBoxRef.current;
    const frame = box?.closest('.voice-viewport');
    if (!box || !gridBox || !frame) return undefined;
    const free = Math.max(0, Math.round(box.getBoundingClientRect().bottom - gridBox.getBoundingClientRect().bottom));
    frame.style.setProperty('--voice-seat-free', `${free}px`);
    return () => frame.style.removeProperty('--voice-seat-free');
  }, [measured?.height, gridMeasured?.height, grid.seats?.length, grid.boardActive, room?.password, selectedCount]);

  return (
    <div ref={scrollRef} {...handlers} className="voice-stage relative min-h-0 flex-1 overflow-hidden px-3 pb-4 pt-1">
      <div ref={boxRef} className="flex h-full min-h-0 flex-col items-center">
        {room?.password && (
          <p className="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-amber-400">
            <Lock className="h-3 w-3" /> Şifreli oda
          </p>
        )}
        {selectedCount > 0 && (
          <div className="mb-3 flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold" style={{ color: seatAccent }}>
              <Gift className="h-3.5 w-3.5 shrink-0" /> {selectedCount} kişi seçildi
            </span>
            <button type="button" onClick={onClearSelection} className="shrink-0 text-[11px] font-bold text-white/60">Temizle</button>
          </div>
        )}
        <div ref={gridBoxRef} className="flex w-full flex-col items-center">
          <VoiceSeatGrid {...grid} stageHeight={measured?.height} keyboardOpen={keyboardOpen} />
        </div>
        <HiddenUserMarquee active={hiddenAnnounce.active} name={hiddenAnnounce.name} />
      </div>
    </div>
  );
}