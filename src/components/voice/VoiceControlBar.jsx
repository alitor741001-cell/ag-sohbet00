import { useLayoutEffect, useRef } from 'react';
import { Gamepad2, Gift, MessageCircle, Mic, MicOff, Send, Star, Volume2, VolumeX } from 'lucide-react';
import '@/components/voice/voiceNeonBars.css';

function Tab({ onClick, label, text, color, off, children }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} data-off={off ? 'true' : 'false'} className={`neon-tab ${color}`}>
      {children}
      <span className="truncate">{text}</span>
    </button>
  );
}

/** Alt kontrol çubuğu: sohbet, mikrofon, hoparlör, hediye, özel sohbet, oyun merkezi ve ayarlar. */
export default function VoiceControlBar({ micActive, deafened, gamesOpen, gamesEnabled = true, settingsOpen, onToggleMic, onToggleSpeaker, onOpenGames, onOpenGifts, onOpenSettings, onOpenPrivateChat, onToggleChat }) {
  const barRef = useRef(null);

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
    <div ref={barRef} className="voice-control-bar relative shrink-0 px-1 pb-[max(0.1rem,calc(env(safe-area-inset-bottom)*0.35))] pt-6">
      <div className="neon-panel dragon-panel dragon-bar neon-glow flex items-center px-1">
        <Tab onClick={onToggleChat} label="Sohbet" text="Sohbet" color="text-amber-300"><MessageCircle /></Tab>
        <Tab onClick={onToggleMic} label="Mikrofon" text="Mikrofon" color="text-fuchsia-400" off={!micActive}>{micActive ? <Mic /> : <MicOff />}</Tab>
        <Tab onClick={onToggleSpeaker} label="Hoparlör" text="Ses" color="text-cyan-300" off={deafened}>{deafened ? <VolumeX /> : <Volume2 />}</Tab>
        <span className="neon-gift-wrap">
          <button type="button" onClick={onOpenGifts} aria-label="Hediye gönder" className="neon-gift"><Gift /><span className="text-white">Hediye</span></button>
        </span>
        <Tab onClick={onOpenPrivateChat} label="Özel sohbet" text="Mesaj" color="text-rose-400"><Send /></Tab>
        {gamesEnabled
          ? <Tab onClick={onOpenGames} label="Oyun merkezi" text="Oyunlar" color={gamesOpen ? 'text-premium-gold' : 'text-lime-400'}><Gamepad2 /></Tab>
          : <span className="flex-1" />}
        <Tab onClick={onOpenSettings} label="Oda ayarları" text="Ayarlar" color={settingsOpen ? 'text-premium-gold' : 'text-violet-400'}><Star /></Tab>
      </div>
    </div>
  );
}