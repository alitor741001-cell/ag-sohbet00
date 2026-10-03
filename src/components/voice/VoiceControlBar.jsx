import { Keyboard, MessageSquare, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const TONES = {
  gray: 'bg-white/10 text-white',
  red: 'bg-red-600 text-white',
  active: 'bg-primary text-primary-foreground',
};

function RoundButton({ onClick, label, tone = 'gray', active, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-95 ${TONES[tone] || TONES.gray} ${active ? 'ring-2 ring-white/30' : ''}`}
    >
      {children}
    </button>
  );
}

/** Alt kontrol çubuğu: sohbet/klavye, mikrofon ve hoparlör. */
export default function VoiceControlBar({ micActive, deafened, chatOpen, onToggleMic, onToggleSpeaker, onToggleChat }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <RoundButton tone={chatOpen ? 'active' : 'gray'} active={chatOpen} onClick={onToggleChat} label={chatOpen ? 'Sohbeti kapat' : 'Sohbeti aç'}>
        {chatOpen ? <Keyboard className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </RoundButton>
      <div className="flex items-center gap-3">
        <RoundButton tone={micActive ? 'active' : 'gray'} active={micActive} onClick={onToggleMic} label="Mikrofon">
          {micActive ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </RoundButton>
        <RoundButton tone={deafened ? 'red' : 'gray'} onClick={onToggleSpeaker} label="Hoparlör">
          {deafened ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </RoundButton>
      </div>
      <span aria-hidden="true" className="h-14 w-14 shrink-0" />
    </div>
  );
}