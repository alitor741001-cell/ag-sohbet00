import { useLayoutEffect, useRef } from 'react';
import { Gamepad2, Gift, MessageCircle, MessageSquare, Mic, MicOff, Settings, Volume2, VolumeX } from 'lucide-react';

// Ana sayfanın alt menüsüyle aynı dil: koyu zemin, ince beyaz ikonlar ve
// ortada yükselen altın hediye düğmesi. Yalnızca durum bildiren ikonlar renk alır.
const ICON = 'h-[22px] w-[22px]';

function BarButton({ onClick, label, children, tone = 'plain', lifted = false }) {
  const base = 'flex shrink-0 items-center justify-center rounded-full transition-transform active:scale-90';
  if (tone === 'gift') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`${base} h-[clamp(50px,15vw,58px)] w-[clamp(50px,15vw,58px)] text-white ${lifted ? '-translate-y-2' : ''}`}
        style={{
          background: 'radial-gradient(circle at 50% 28%, #ffe89a 0%, #e0b73f 42%, #a8801f 78%, #7d5c12 100%)',
          boxShadow: '0 0 18px 2px rgba(224,183,63,0.55), inset 0 1px 0 rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,236,168,0.85)',
        }}
      >
        {children}
      </button>
    );
  }
  const tint = tone === 'active' ? 'text-[#ffe89a]' : tone === 'off' ? 'text-white/45' : 'text-white';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`${base} h-11 w-11 ${tint} ${lifted ? '-translate-y-2' : ''}`}
    >
      {children}
    </button>
  );
}

/** Alt kontrol çubuğu: sohbet, mikrofon, hoparlör, hediye, özel sohbet, oyun merkezi ve ayarlar. */
export default function VoiceControlBar({ micActive, deafened, gamesOpen, gamesEnabled = true, giftOpen, settingsOpen, keyboardOpen, onToggleMic, onToggleSpeaker, onOpenGames, onOpenGifts, onOpenSettings, onOpenPrivateChat, onToggleChat }) {
  const barRef = useRef(null);

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
      className="voice-control-bar flex shrink-0 items-center justify-between gap-0.5 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2"
      style={{ background: 'linear-gradient(180deg, #17171b 0%, #0d0d10 100%)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      <BarButton onClick={onToggleChat} label="Sohbet">
        <MessageSquare className={ICON} strokeWidth={1.6} />
      </BarButton>
      <BarButton onClick={onToggleMic} label="Mikrofon" tone={micActive ? 'active' : 'plain'}>
        {micActive ? <Mic className={ICON} strokeWidth={1.6} /> : <MicOff className={ICON} strokeWidth={1.6} />}
      </BarButton>
      <BarButton onClick={onToggleSpeaker} label="Hoparlör" tone={deafened ? 'off' : 'plain'}>
        {deafened ? <VolumeX className={ICON} strokeWidth={1.6} /> : <Volume2 className={ICON} strokeWidth={1.6} />}
      </BarButton>

      <BarButton onClick={onOpenGifts} label="Hediye gönder" tone="gift" lifted>
        <Gift className="h-6 w-6" strokeWidth={1.6} />
      </BarButton>

      <BarButton onClick={onOpenPrivateChat} label="Özel sohbet">
        <MessageCircle className={ICON} strokeWidth={1.6} />
      </BarButton>
      {gamesEnabled ? (
        <BarButton onClick={onOpenGames} label="Oyun merkezi" tone={gamesOpen ? 'active' : 'plain'}>
          <Gamepad2 className={ICON} strokeWidth={1.6} />
        </BarButton>
      ) : (
        <span className="h-11 w-11 shrink-0" />
      )}
      <BarButton onClick={onOpenSettings} label="Oda ayarları" tone={settingsOpen ? 'active' : 'plain'}>
        <Settings className={ICON} strokeWidth={1.6} />
      </BarButton>
    </div>
  );
}