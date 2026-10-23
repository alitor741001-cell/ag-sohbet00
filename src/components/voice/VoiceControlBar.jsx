import { useLayoutEffect, useRef } from 'react';
import RefSprite from '@/components/voice/refSprite';

// Tasarım görselindeki alt bar; düğmeler görselin üstünde görünmez dokunma alanlarıdır.
const SLOTS = [
  ['chat', 'Sohbet', 3, 15],
  ['mic', 'Mikrofon', 17, 11],
  ['speaker', 'Hoparlör', 29, 11],
  ['gift', 'Hediye gönder', 41, 18],
  ['dm', 'Özel sohbet', 60, 11],
  ['games', 'Oyun merkezi', 72, 11],
  ['settings', 'Ayarlar', 84, 12],
];

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
    return () => { observer.disconnect(); frame.style.removeProperty('--voice-bar-height'); };
  }, []);

  const actions = { chat: onToggleChat, mic: onToggleMic, speaker: onToggleSpeaker, gift: onOpenGifts, dm: onOpenPrivateChat, games: gamesEnabled ? onOpenGames : undefined, settings: onOpenSettings };

  return (
    <div ref={barRef} className="voice-control-bar relative shrink-0 pb-[env(safe-area-inset-bottom)]">
      <RefSprite x={0} y={1576} w={872} h={228} className="w-full">
        {SLOTS.map(([key, label, left, width]) => (
          <button key={key} type="button" onClick={actions[key]} aria-label={label} className="absolute top-[25%] h-[65%] rounded-full active:bg-white/10" style={{ left: `${left}%`, width: `${width}%` }} />
        ))}
        {micActive && <span className="pointer-events-none absolute left-[22%] top-[40%] h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]" />}
        {deafened && <span className="pointer-events-none absolute left-[29%] top-[48%] h-[2px] w-[9%] rotate-45 bg-red-500" />}
      </RefSprite>
    </div>
  );
}