import { useLayoutEffect, useRef } from 'react';
import useVoiceBarPng from '@/hooks/useVoiceBarPng';
import { Image } from '@/components/ui/image';
import PrivateChatBadge from '@/components/messages/PrivateChatBadge';

const zone = (center, width = 12) => ({ position: 'absolute', left: `${center - width / 2}%`, top: '10%', width: `${width}%`, height: '80%' });
const Off = () => <span className="pointer-events-none absolute left-1/2 top-[40%] h-[3px] w-3/4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded bg-destructive" />;

/** Alt kontrol çubuğu: tasarım görseli, butonları görselin üzerindeki dokunma alanlarıdır. */
export default function VoiceControlBar({ micActive, requesting = false, deafened, gamesEnabled = true, privateUnread = 0, onToggleMic, onToggleSpeaker, onOpenGames, onOpenGifts, onOpenSettings, onOpenPrivateChat, onToggleChat }) {
  const barRef = useRef(null);
  const { src, ratio } = useVoiceBarPng();

  // Çubuğun gerçek yüksekliği oda çerçevesine bildirilir: sohbet alanı tam butonların üstünde biter.
  useLayoutEffect(() => {
    const bar = barRef.current;
    const frame = bar?.closest('.voice-viewport');
    if (!bar || !frame) return undefined;
    const apply = () => {
      // Yükseklik yalnızca bir kez yazılır: çubuk görseli sonradan çözülse de oda düzeni
      // yeniden ölçülmez, koltuklar yerinden oynamaz.
      const height = Math.round(bar.getBoundingClientRect().height);
      if (height > 0 && !frame.style.getPropertyValue('--voice-bar-height')) {
        frame.style.setProperty('--voice-bar-height', `${height}px`);
      }
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      frame.style.removeProperty('--voice-bar-height');
    };
  }, []);

  const btn = 'rounded-full active:bg-primary/20 transition-colors';
  return (
    <div ref={barRef} className="voice-control-bar relative w-full shrink-0" style={{ aspectRatio: ratio || '3 / 1', visibility: src ? 'visible' : 'hidden' }}>
      {src && <Image src={src} alt="Alt menü" className="pointer-events-none absolute inset-0 h-full w-full select-none" fittingType="fit" />}
      <button type="button" aria-label="Sohbet" onClick={onToggleChat} className={btn} style={zone(7.1)} />
      <button type="button" aria-label={requesting ? 'Mikrofon hazırlanıyor' : 'Mikrofon'} aria-busy={requesting} disabled={requesting} aria-pressed={micActive} onClick={onToggleMic} className={btn} style={zone(21.4)}>{micActive && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />}</button>
      <button type="button" aria-label="Hoparlör" aria-pressed={!deafened} onClick={onToggleSpeaker} className={btn} style={zone(35.7)}>{deafened && <Off />}</button>
      <button type="button" aria-label="Hediye gönder" onClick={onOpenGifts} className={btn} style={zone(50, 14)} />
      <button type="button" aria-label="Özel sohbet" onClick={onOpenPrivateChat} className={btn} style={zone(64.3)}><PrivateChatBadge count={privateUnread} /></button>
      {gamesEnabled && <button type="button" aria-label="Oyun merkezi" onClick={onOpenGames} className={btn} style={zone(78.6)} />}
      <button type="button" aria-label="Oda ayarları" onClick={onOpenSettings} className={btn} style={zone(92.9)} />
    </div>
  );
}