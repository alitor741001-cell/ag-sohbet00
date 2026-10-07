import { useLayoutEffect, useRef } from 'react';
import { Gamepad2, Gift, MessageCircle, MessageSquare, Mic, MicOff, Settings, Volume2, VolumeX } from 'lucide-react';

const TONES = {
  // Sade düğmede arka plan yok: ikonlar siyah zemine gömülmez, doğrudan görünür.
  // Yalnızca durum bildiren düğmeler (mikrofon, hoparlör, hediye) renkli kalır.
  gray: 'text-white',
  red: 'bg-red-600 text-white',
  active: 'bg-primary text-primary-foreground',
  gift: 'bg-gradient-to-br from-pink-500 to-amber-400 text-white',
};

// Düğme boyutu ekranla ölçeklenir: dar telefonlarda da çubuk ekrana sığar,
// dokunma alanı 40px'in altına inmez, geniş ekranlarda gereksiz büyümez.
const SIZES = {
  md: 'h-[clamp(40px,12vw,48px)] w-[clamp(40px,12vw,48px)]',
  lg: 'h-[clamp(44px,14vw,56px)] w-[clamp(44px,14vw,56px)]',
};

function RoundButton({ onClick, label, tone = 'gray', active, size = 'lg', children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex ${SIZES[size] || SIZES.lg} shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 ${TONES[tone] || TONES.gray} ${active ? 'ring-2 ring-white/30' : ''}`}
    >
      {children}
    </button>
  );
}

/** Alt kontrol çubuğu: sohbet, mikrofon, hoparlör, oyun merkezi ve özel sohbet. */
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
    // Çubuk kendi siyah zeminiyle durur: siyah alan butonların altında kalır, ikonların önüne
    // geçen bir katman olmaz. Klavye açıkken ayrılan boşluk kaldırılır, çubuk klavyenin
    // hemen üstüne oturur.
    <div ref={barRef} className="voice-control-bar flex shrink-0 items-center justify-between gap-1 bg-catalog px-3 pt-2">
      {/* Sohbet düğmesi sabittir: açıkken ikonu ve rengi değişmez, hep aynı görünür. */}
      <RoundButton onClick={onToggleChat} label="Sohbet">
        <MessageSquare className="h-6 w-6" />
      </RoundButton>
      <div className="flex min-w-0 items-center gap-1.5">
        <RoundButton size="md" tone={micActive ? 'active' : 'gray'} active={micActive} onClick={onToggleMic} label="Mikrofon">
          {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </RoundButton>
        <RoundButton size="md" tone={deafened ? 'red' : 'gray'} onClick={onToggleSpeaker} label="Hoparlör">
          {deafened ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </RoundButton>
        <RoundButton size="md" tone="gift" active={giftOpen} onClick={onOpenGifts} label="Hediye gönder">
          <Gift className="h-5 w-5" />
        </RoundButton>
        <RoundButton size="md" onClick={onOpenPrivateChat} label="Özel sohbet">
          <MessageCircle className="h-5 w-5" />
        </RoundButton>
        {/* Oyun merkezi yalnızca yayıncı/ajans üyesi hesaplarda görünür. */}
        {gamesEnabled && (
          <RoundButton size="md" tone={gamesOpen ? 'active' : 'gray'} active={gamesOpen} onClick={onOpenGames} label="Oyun merkezi">
            <Gamepad2 className="h-5 w-5" />
          </RoundButton>
        )}
      </div>
      <RoundButton size="md" tone={settingsOpen ? 'active' : 'gray'} active={settingsOpen} onClick={onOpenSettings} label="Oda ayarları">
        <Settings className="h-5 w-5" />
      </RoundButton>
    </div>
  );
}