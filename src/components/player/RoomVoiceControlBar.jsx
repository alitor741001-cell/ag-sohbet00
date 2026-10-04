import { Gamepad2, MessageSquare, Mic, MicOff, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';

const TONES = {
  gray: 'bg-white/10 text-white',
  red: 'bg-red-600 text-white',
  active: 'bg-primary text-primary-foreground',
};

function RoundButton({ label, onClick, tone = 'gray', active, disabled, badge = 0, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-95 disabled:opacity-40 ${TONES[tone] || TONES.gray} ${active ? 'ring-2 ring-white/30' : ''}`}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

/** Özel odanın sesli sohbet modu için alt çubuk: oyunlar, sohbet, mikrofon, hoparlör ve oda ayarları. */
export default function RoomVoiceControlBar({ micActive, micDisabled, deafened, chatOpen, gamesOpen, unread = 0, onToggleMic, onToggleSpeaker, onOpenGames, onToggleChat, onOpenSettings }) {
  return (
    <div className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-black/95 px-3 pt-2 backdrop-blur-xl" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
      <RoundButton label="Oyunlar" tone={gamesOpen ? 'active' : 'gray'} active={gamesOpen} onClick={onOpenGames}>
        <Gamepad2 className="h-5 w-5" />
      </RoundButton>
      <RoundButton label="Sohbet" tone={chatOpen ? 'active' : 'gray'} active={chatOpen} badge={chatOpen ? 0 : unread} onClick={onToggleChat}>
        <MessageSquare className="h-5 w-5" />
      </RoundButton>
      <RoundButton label="Mikrofon" tone={micActive ? 'active' : 'gray'} active={micActive} disabled={micDisabled} onClick={onToggleMic}>
        {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </RoundButton>
      <RoundButton label="Hoparlör" tone={deafened ? 'red' : 'gray'} onClick={onToggleSpeaker}>
        {deafened ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </RoundButton>
      <RoundButton label="Oda ayarları" onClick={onOpenSettings}>
        <MoreHorizontal className="h-5 w-5" />
      </RoundButton>
    </div>
  );
}