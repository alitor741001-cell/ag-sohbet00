import { Gamepad2, Gift, Keyboard, MessageCircle, MessageSquare, Mic, MicOff, Settings, Volume2, VolumeX } from 'lucide-react';

const TONES = {
  gray: 'bg-white/10 text-white',
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
      className={`flex ${SIZES[size] || SIZES.lg} shrink-0 items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-95 ${TONES[tone] || TONES.gray} ${active ? 'ring-2 ring-white/30' : ''}`}
    >
      {children}
    </button>
  );
}

/** Alt kontrol çubuğu: sohbet, mikrofon, hoparlör, oyun merkezi ve özel sohbet. */
export default function VoiceControlBar({ micActive, deafened, chatOpen, gamesOpen, giftOpen, settingsOpen, onToggleMic, onToggleSpeaker, onOpenGames, onOpenGifts, onOpenSettings, onOpenPrivateChat, onToggleChat }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-1 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <RoundButton tone={chatOpen ? 'active' : 'gray'} active={chatOpen} onClick={onToggleChat} label={chatOpen ? 'Sohbeti kapat' : 'Sohbeti aç'}>
        {chatOpen ? <Keyboard className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
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
        <RoundButton size="md" tone={gamesOpen ? 'active' : 'gray'} active={gamesOpen} onClick={onOpenGames} label="Oyun merkezi">
          <Gamepad2 className="h-5 w-5" />
        </RoundButton>
        <RoundButton size="md" onClick={onOpenPrivateChat} label="Özel sohbet">
          <MessageCircle className="h-5 w-5" />
        </RoundButton>
      </div>
      <RoundButton size="md" tone={settingsOpen ? 'active' : 'gray'} active={settingsOpen} onClick={onOpenSettings} label="Oda ayarları">
        <Settings className="h-5 w-5" />
      </RoundButton>
    </div>
  );
}