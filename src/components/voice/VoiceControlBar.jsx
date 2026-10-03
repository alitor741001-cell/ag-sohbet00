import { MessageSquare, Mic, MicOff, Sparkles, UserPlus, Volume2, VolumeX } from 'lucide-react';

const TONES = {
  gray: 'bg-white/10 text-white',
  red: 'bg-red-600 text-white',
  green: 'bg-green-500 text-white',
};

function RoundButton({ onClick, label, tone = 'gray', active, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 ${TONES[tone] || TONES.gray} ${active ? 'ring-2 ring-white/40' : ''}`}
    >
      {children}
    </button>
  );
}

/** Alt kontrol çubuğu: canlı akış, mikrofon, hoparlör, sohbet ve davet. */
export default function VoiceControlBar({ micActive, deafened, chatOpen, feedOpen, onToggleMic, onToggleSpeaker, onToggleChat, onToggleFeed, onInvite }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
      <RoundButton tone={feedOpen ? 'green' : 'gray'} active={feedOpen} onClick={onToggleFeed} label="Canlı mesaj akışı">
        <Sparkles className="h-6 w-6" />
      </RoundButton>
      <div className="flex items-center gap-2 sm:gap-3">
        <RoundButton tone={micActive ? 'green' : 'gray'} active={micActive} onClick={onToggleMic} label="Mikrofon">
          {micActive ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </RoundButton>
        <RoundButton tone={deafened ? 'red' : 'gray'} active={!deafened} onClick={onToggleSpeaker} label="Hoparlör">
          {deafened ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </RoundButton>
        <RoundButton tone={chatOpen ? 'green' : 'gray'} active={chatOpen} onClick={onToggleChat} label="Sohbet">
          <MessageSquare className="h-6 w-6" />
        </RoundButton>
        <RoundButton tone="gray" onClick={onInvite} label="Davet et">
          <UserPlus className="h-6 w-6" />
        </RoundButton>
      </div>
    </div>
  );
}