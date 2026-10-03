import { Gamepad2, Keyboard, MessageCircle, MessageSquare, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const TONES = {
  gray: 'bg-white/10 text-white',
  red: 'bg-red-600 text-white',
  active: 'bg-primary text-primary-foreground',
  pink: 'bg-game-pink text-white',
};

const SIZES = {
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
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
export default function VoiceControlBar({ micActive, deafened, chatOpen, onToggleMic, onToggleSpeaker, onOpenGames, onOpenPrivateChat, onToggleChat }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <RoundButton tone={chatOpen ? 'active' : 'gray'} active={chatOpen} onClick={onToggleChat} label={chatOpen ? 'Sohbeti kapat' : 'Sohbeti aç'}>
        {chatOpen ? <Keyboard className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </RoundButton>
      <div className="flex items-center gap-2">
        <RoundButton size="md" tone={micActive ? 'active' : 'gray'} active={micActive} onClick={onToggleMic} label="Mikrofon">
          {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </RoundButton>
        <RoundButton size="md" tone={deafened ? 'red' : 'gray'} onClick={onToggleSpeaker} label="Hoparlör">
          {deafened ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </RoundButton>
        <RoundButton size="md" tone="pink" onClick={onOpenGames} label="Oyun Merkezi">
          <Gamepad2 className="h-5 w-5" />
        </RoundButton>
        <RoundButton size="md" onClick={onOpenPrivateChat} label="Özel sohbet">
          <MessageCircle className="h-5 w-5" />
        </RoundButton>
      </div>
    </div>
  );
}