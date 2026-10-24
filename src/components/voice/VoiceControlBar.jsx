import { useLayoutEffect, useRef } from 'react';
import useKeyedImage from '@/hooks/useKeyedImage';

const BAR_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/8c3e10240_IMG_0231.jpg';
// Görselin (748x1024) alt buton şeridi: y 790 → 1024.
const W = 748;
const TOP = 790;
const H = 234;
const CROP = { top: TOP / 1024, height: H / 1024 };

const zone = (cx, cy, w, h = w) => ({
  position: 'absolute',
  left: `${((cx - w / 2) / W) * 100}%`,
  top: `${((cy - TOP - h / 2) / H) * 100}%`,
  width: `${(w / W) * 100}%`,
  height: `${(h / H) * 100}%`,
});

const Off = () => <span className="pointer-events-none absolute left-1/2 top-[40%] h-[3px] w-3/4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]" />;

/** Alt kontrol çubuğu: tasarım görseli, butonları görselin üzerindeki dokunma alanlarıdır. */
export default function VoiceControlBar({ micActive, deafened, gamesEnabled = true, onToggleMic, onToggleSpeaker, onOpenGames, onOpenGifts, onOpenSettings, onOpenPrivateChat, onToggleChat }) {
  const barRef = useRef(null);
  const src = useKeyedImage(BAR_URL, CROP);

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

  const btn = 'rounded-full active:bg-white/15 transition-colors';
  return (
    <div ref={barRef} className="voice-control-bar relative w-full shrink-0" style={{ aspectRatio: `${W} / ${H}`, transform: 'translateY(7px)' }}>
      {src && <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />}
      <button type="button" aria-label="Sohbet" onClick={onToggleChat} className={btn} style={zone(78, 938, 84)} />
      <button type="button" aria-label="Mikrofon" onClick={onToggleMic} className={btn} style={zone(172, 938, 84)}>{!micActive && <Off />}</button>
      <button type="button" aria-label="Hoparlör" onClick={onToggleSpeaker} className={btn} style={zone(262, 938, 84)}>{deafened && <Off />}</button>
      <button type="button" aria-label="Hediye gönder" onClick={onOpenGifts} className={btn} style={zone(374, 918, 124)} />
      <button type="button" aria-label="Özel sohbet" onClick={onOpenPrivateChat} className={btn} style={zone(486, 938, 84)} />
      {gamesEnabled && <button type="button" aria-label="Oyun merkezi" onClick={onOpenGames} className={btn} style={zone(580, 938, 84)} />}
      <button type="button" aria-label="Oda ayarları" onClick={onOpenSettings} className={btn} style={zone(667, 938, 84)} />
    </div>
  );
}