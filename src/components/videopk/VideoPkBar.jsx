import { Inbox, Mic, MicOff, Video, VideoOff, Gift, LogOut, UserPlus, MessageSquare } from 'lucide-react';

const ActionButton = ({ Icon, label, onClick, disabled, active = true, tone = 'default' }) => {
  const tones = {
    default: 'bg-white/10 text-white ring-white/15',
    pink: 'text-white ring-fuchsia-300/50',
    off: 'bg-white/8 text-white/50 ring-white/10',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full ring-1 active:scale-95 disabled:opacity-40 ${tones[active ? tone : 'off']}`}
      style={tone === 'pink' && active
        ? { backgroundImage: 'linear-gradient(135deg,#ff2c93,#8b16d8)' }
        : undefined}
    >
      <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
    </button>
  );
};

/**
 * Görüntülü PK alt şeridi.
 * Üst satır: PK Davet Onayı (solda) ve PK Davet Et; alt satır: mikrofon, kamera, hediye, çıkış.
 */
export default function VideoPkBar({
  inviteCount = 0, onOpenInbox, onOpenInvite, inviteDisabled, inviteLabel = 'PK Davet Et',
  micOn, onMic, camOn, onCam, onGift, giftDisabled, onExit, inMatch,
  onChat, chatOpen = false, chatDisabled = false,
}) {
  return (
    <div
      className="shrink-0 border-t border-white/10 bg-[#120a18]/95 px-3 pt-2 backdrop-blur"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenInbox}
          className="relative flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.07] text-[11.5px] font-black text-white active:scale-[0.98]"
        >
          <Inbox className="h-4 w-4" />
          PK Davet Onayı
          {inviteCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-[#120a18]">
              {inviteCount > 9 ? '9+' : inviteCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenInvite}
          disabled={inviteDisabled}
          className="flame-live flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[11.5px] font-black text-white active:scale-[0.98] disabled:opacity-45"
          style={{ backgroundImage: 'linear-gradient(115deg,#ffb3f0 0%,#d946ef 45%,#7c0ea0 100%)' }}
        >
          <UserPlus className="h-4 w-4" />
          {inviteLabel}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <ActionButton
          Icon={micOn ? Mic : MicOff}
          label={micOn ? 'Mikrofonu kapat' : 'Mikrofonu aç'}
          onClick={onMic}
          active={micOn}
        />
        <ActionButton
          Icon={camOn ? Video : VideoOff}
          label={camOn ? 'Kamerayı kapat' : 'Kamerayı aç'}
          onClick={onCam}
          active={camOn}
        />
        <ActionButton
          Icon={MessageSquare}
          label="PK sohbeti"
          onClick={onChat}
          disabled={chatDisabled}
          tone={chatOpen ? 'pink' : 'default'}
        />
        <ActionButton
          Icon={Gift}
          label="Hediye gönder"
          onClick={onGift}
          disabled={giftDisabled}
          tone="pink"
        />
        <ActionButton Icon={LogOut} label={inMatch ? 'PK’dan ayrıl' : 'Çıkış'} onClick={onExit} />
      </div>
    </div>
  );
}