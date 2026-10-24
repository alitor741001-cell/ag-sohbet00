import { useLayoutEffect, useRef } from 'react';
import useTransparentArt from '@/lib/useTransparentArt';

const BAR_ART = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/04330aa6a_IMG_0189.jpg';

/** Alt kontrol çubuğu: sohbet, mikrofon, hoparlör, hediye, özel sohbet, oyun merkezi ve ayarlar. */
export default function VoiceControlBar({ micActive, deafened, gamesOpen, gamesEnabled = true, giftOpen, settingsOpen, keyboardOpen, onToggleMic, onToggleSpeaker, onOpenGames, onOpenGifts, onOpenSettings, onOpenPrivateChat, onToggleChat }) {
  const barRef = useRef(null);
  const art = useTransparentArt(BAR_ART);

  // Çubuğun gerçek yüksekliği oda çerçevesine bildirilir: sohbet alanı tam butonların üstünde
  // biter, butonlarla sohbet arasında siyah bir şerit kalmaz. Ekran boyutu ya da alt güvenli
  // alan değişirse ayrılan yer kendiliğinden güncellenir.
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
    <div
      ref={barRef}
      className="voice-control-bar relative z-30 -mb-2 shrink-0 pb-[max(0.1rem,calc(env(safe-area-inset-bottom)*0.2))]"
    >
      <div className="relative w-full" style={{ aspectRatio: '1024 / 290' }}>
        {art && <img src={art} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill" />}
        {[
          ['Sohbet', onToggleChat, '3%', '16%'],
          ['Mikrofon', onToggleMic, '20%', '10%'],
          ['Hoparlör', onToggleSpeaker, '31%', '10%'],
          ['Hediye gönder', onOpenGifts, '42%', '16%'],
          ['Özel sohbet', onOpenPrivateChat, '59%', '11%'],
          ['Oyun merkezi', gamesEnabled ? onOpenGames : undefined, '71%', '11%'],
          ['Oda ayarları', onOpenSettings, '83%', '12%'],
        ].map(([label, onClick, left, width]) => (
          <button key={label} type="button" aria-label={label} onClick={onClick} className="absolute rounded-full active:bg-white/10" style={{ left, width, top: '20%', height: '65%' }} />
        ))}
      </div>
    </div>
  );
}