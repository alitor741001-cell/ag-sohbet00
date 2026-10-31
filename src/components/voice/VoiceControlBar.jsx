import { useLayoutEffect, useRef } from 'react';
import PrivateChatBadge from '@/components/messages/PrivateChatBadge';
import useCutoutSprites from '@/hooks/useCutoutSprites';

const SPRITE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/c4f7f986e_IMG_0523.jpg';

/** Alt kontrol çubuğu: şeffaf PNG düğmeler — altında beyaz zemin yok. */
export default function VoiceControlBar({ micActive, deafened, gamesEnabled = true, privateUnread = 0, onToggleMic, onToggleSpeaker, onOpenGames, onOpenGifts, onOpenSettings, onOpenPrivateChat, onToggleChat }) {
  const barRef = useRef(null);
  const sprites = useCutoutSprites(SPRITE, 7, true);

  // Çubuğun gerçek yüksekliği oda çerçevesine bildirilir: sohbet alanı tam butonların üstünde biter.
  useLayoutEffect(() => {
    const bar = barRef.current;
    const frame = bar?.closest('.voice-viewport');
    if (!bar || !frame) return undefined;
    const apply = () => {
      const height = Math.round(bar.getBoundingClientRect().height);
      if (height > 0) frame.style.setProperty('--voice-bar-height', `${height}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      frame.style.removeProperty('--voice-bar-height');
    };
  }, []);

  const items = [
    { key: 'chat', label: 'Sohbet', onClick: onToggleChat },
    { key: 'mic', label: 'Mikrofon', onClick: onToggleMic },
    { key: 'sound', label: 'Ses', onClick: onToggleSpeaker },
    { key: 'gift', label: 'Hediye', onClick: onOpenGifts },
    { key: 'dm', label: 'Mesaj', onClick: onOpenPrivateChat, badge: true },
    ...(gamesEnabled ? [{ key: 'games', label: 'Oyunlar', onClick: onOpenGames }] : []),
    { key: 'settings', label: 'Ayarlar', onClick: onOpenSettings },
  ];

  // Görseldeki yedi düğme sırası korunur; oyunlar kapalıysa yalnızca altısı gösterilir.
  const order = gamesEnabled ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 6];

  return (
    <div ref={barRef} className="voice-control-bar relative w-full shrink-0" style={{ paddingBottom: 'max(2px, calc(env(safe-area-inset-bottom, 0px) * 0.25))' }}>
      <div className="flex w-full items-end justify-between gap-0.5 px-0.5">
        {items.map((item, index) => {
          const sprite = sprites[order[index]];
          return (
            <button
              key={item.key}
              type="button"
              aria-label={item.label}
              aria-pressed={item.key === 'mic' ? micActive : item.key === 'sound' ? !deafened : undefined}
              onClick={item.onClick}
              className="relative flex flex-1 items-end justify-center transition-transform active:scale-95"
            >
              {sprite ? (
                <img
                  src={sprite.src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none select-none"
                  style={{
                    height: 'clamp(38px, 11.5vw, 52px)',
                    width: 'auto',
                    filter: item.key === 'mic' && micActive
                      ? 'brightness(1.2) drop-shadow(0 0 8px rgba(74,222,128,0.75))'
                      : 'none',
                  }}
                />
              ) : (
                <span aria-hidden="true" style={{ height: 'clamp(38px, 11.5vw, 52px)' }} />
              )}
              {item.badge && <PrivateChatBadge count={privateUnread} />}
              {item.key === 'mic' && micActive && <span className="absolute right-[30%] top-0 h-2 w-2 rounded-full bg-green-400" />}
              {item.key === 'sound' && deafened && <span className="absolute bottom-[34%] left-1/2 h-[2px] w-[46%] -translate-x-1/2 rotate-45 rounded bg-destructive" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}