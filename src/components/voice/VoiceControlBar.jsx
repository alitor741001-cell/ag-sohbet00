import { useLayoutEffect, useRef } from 'react';
import useRoomBarArt from '@/components/voice/useRoomBarArt';

// Görseldeki her düğmenin yatay konumu (yüzde).
const TABS = [
  { key: 'chat', label: 'Sohbet', left: 2, width: 15 },
  { key: 'mic', label: 'Mikrofon', left: 17.5, width: 12.5 },
  { key: 'speaker', label: 'Hoparlör', left: 30, width: 11 },
  { key: 'gift', label: 'Hediye gönder', left: 41, width: 18 },
  { key: 'dm', label: 'Özel sohbet', left: 59.5, width: 12 },
  { key: 'games', label: 'Oyun merkezi', left: 72, width: 12.5 },
  { key: 'settings', label: 'Oda ayarları', left: 85, width: 13 },
];

/** Alt kontrol çubuğu: gönderilen tasarım görseli birebir, düğmeler görselin üstündeki dokunma alanları. */
export default function VoiceControlBar({ micActive, deafened, gamesEnabled = true, onToggleMic, onToggleSpeaker, onOpenGames, onOpenGifts, onOpenSettings, onOpenPrivateChat, onToggleChat }) {
  const barRef = useRef(null);
  const art = useRoomBarArt('bottom');
  const actions = { chat: onToggleChat, mic: onToggleMic, speaker: onToggleSpeaker, gift: onOpenGifts, dm: onOpenPrivateChat, games: gamesEnabled ? onOpenGames : undefined, settings: onOpenSettings };
  const dimmed = { mic: !micActive, speaker: deafened, games: !gamesEnabled };

  // Çubuğun gerçek yüksekliği oda çerçevesine bildirilir: sohbet alanı tam butonların üstünde biter.
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
    <div ref={barRef} className="voice-control-bar relative shrink-0 px-1 pb-[max(0.25rem,calc(env(safe-area-inset-bottom)*0.5))]">
      <div className="relative w-full" style={{ aspectRatio: art?.ratio || '856 / 243' }}>
        {art && <img src={art.src} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />}
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-label={t.label}
            onClick={actions[t.key]}
            className={`absolute rounded-xl transition-colors active:bg-white/15 ${dimmed[t.key] ? 'bg-black/45' : ''}`}
            style={{ left: `${t.left}%`, width: `${t.width}%`, top: t.key === 'gift' ? '8%' : '30%', height: t.key === 'gift' ? '84%' : '58%' }}
          />
        ))}
      </div>
    </div>
  );
}