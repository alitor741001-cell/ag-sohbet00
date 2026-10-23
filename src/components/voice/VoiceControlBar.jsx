import { useLayoutEffect, useRef } from 'react';
import { Mic, VolumeX } from 'lucide-react';
import DesignSprite from '@/components/voice/DesignSprite';

const hit = 'absolute top-[18%] h-[72%] rounded-full transition-transform active:scale-90';

/** Alt kontrol çubuğu: referans tasarımın birebir alt barı, düğmeler üstüne yerleşik. */
export default function VoiceControlBar({ micActive, deafened, gamesEnabled = true, onToggleMic, onToggleSpeaker, onOpenGames, onOpenGifts, onOpenSettings, onOpenPrivateChat, onToggleChat }) {
  const barRef = useRef(null);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const frame = bar?.closest('.voice-viewport');
    if (!bar || !frame) return undefined;
    const apply = () => frame.style.setProperty('--voice-bar-height', `${Math.round(bar.getBoundingClientRect().height)}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      frame.style.removeProperty('--voice-bar-height');
    };
  }, []);

  return (
    <div ref={barRef} className="voice-control-bar relative shrink-0 pb-[calc(env(safe-area-inset-bottom)*0.5)]">
      <DesignSprite x={0} y={908} w={494} h={116} className="w-full">
        <button type="button" onClick={onToggleChat} aria-label="Sohbet" className={`${hit} left-[3.6%] w-[15%]`} />
        <button type="button" onClick={onToggleMic} aria-label="Mikrofon" className={`${hit} left-[21%] w-[7.7%]`}>
          {micActive && (
            <span className="absolute inset-[18%] flex items-center justify-center rounded-full bg-[#0b0b1e]">
              <Mic className="h-[70%] w-[70%] text-[#f4e1a1] drop-shadow-[0_0_6px_#f5c542]" strokeWidth={1.8} />
            </span>
          )}
        </button>
        <button type="button" onClick={onToggleSpeaker} aria-label="Hoparlör" className={`${hit} left-[29.6%] w-[9.3%]`}>
          {deafened && (
            <span className="absolute inset-[18%] flex items-center justify-center rounded-full bg-[#0b0b1e]">
              <VolumeX className="h-[70%] w-[70%] text-white/60" strokeWidth={1.8} />
            </span>
          )}
        </button>
        <button type="button" onClick={onOpenGifts} aria-label="Hediye gönder" className="absolute left-[41.7%] top-0 h-full w-[17%] rounded-full active:scale-90" />
        <button type="button" onClick={onOpenPrivateChat} aria-label="Özel sohbet" className={`${hit} left-[60.7%] w-[9.3%]`} />
        {gamesEnabled && <button type="button" onClick={onOpenGames} aria-label="Oyun merkezi" className={`${hit} left-[71.7%] w-[11.3%]`} />}
        <button type="button" onClick={onOpenSettings} aria-label="Oda ayarları" className={`${hit} left-[84.6%] w-[9.7%]`} />
      </DesignSprite>
    </div>
  );
}