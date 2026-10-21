import { Ban, DoorOpen, MessageCircle, MoreVertical, UserMinus } from 'lucide-react';
import ProfileFrame from '@/components/ProfileFrame';
import XpAvatar from '@/components/xp/XpAvatar';
import LiveBadge from '@/components/friends/LiveBadge';

const CHAT_STYLE = { background: 'linear-gradient(135deg,#d8fffb 0%,#6fe6dc 50%,#9ad7ff 100%)' };

/** Tek arkadaş satırı: kristal panel içinde avatar, durum ve işlemler. */
export default function FriendRow({
  name, member, avatar, friendId, frame, online, liveRoom, showStatusDot,
  menuOpen, onToggleMenu, onOpenCard, onChat, onUnfriend, onBlock, onJoin,
}) {
  return (
    <div className="border-b border-[#7dd3fc]/12 px-3 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpenCard} className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-80">
          <span className="relative shrink-0">
            {frame
              ? <ProfileFrame frame={frame} avatar={avatar} name={name} size="sm" />
              : <XpAvatar avatar={avatar} name={name} userId={friendId} size="sm" />}
            {liveRoom && <LiveBadge />}
            {showStatusDot && (
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#06142c]"
                style={{ background: online ? '#34d399' : '#475569' }}
              />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-black text-white">{name}</span>
            <span className="block truncate text-[10.5px] font-semibold text-white/45">
              {liveRoom
                ? <span className="text-[#f97316]">Yayında</span>
                : online ? <span className="text-[#6fe6dc]">Çevrim içi</span> : 'Çevrim dışı'}
              {member ? ` · ${member}` : ''}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onChat}
          className="flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-black text-[#052033] active:scale-95"
          style={CHAT_STYLE}
        >
          <MessageCircle className="h-3.5 w-3.5" /> Sohbet
        </button>
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label="Seçenekler"
          className="shrink-0 rounded-full border p-1.5 active:scale-95"
          style={{
            borderColor: menuOpen ? 'rgba(111,230,220,0.6)' : 'rgba(125,211,252,0.25)',
            background: menuOpen ? 'rgba(111,230,220,0.14)' : 'transparent',
          }}
        >
          <MoreVertical className="h-4 w-4 text-[#a5e4ff]" />
        </button>
      </div>

      {liveRoom?.isPublic && (
        <button
          type="button"
          onClick={onJoin}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#6fe6dc]/35 bg-[#6fe6dc]/12 py-1.5 text-[11px] font-black text-[#6fe6dc] active:scale-[0.99]"
        >
          <DoorOpen className="h-3.5 w-3.5" /> Yayına Katıl
        </button>
      )}

      {menuOpen && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onUnfriend}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-[#7dd3fc]/25 bg-[#0b2a52] py-1.5 text-[11px] font-bold text-[#a5e4ff] active:scale-[0.98]"
          >
            <UserMinus className="h-3.5 w-3.5" /> Arkadaşlıktan Çıkar
          </button>
          <button
            type="button"
            onClick={onBlock}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-[#ff7b7b]/40 bg-[#3a1020]/70 py-1.5 text-[11px] font-bold text-[#ff9b9b] active:scale-[0.98]"
          >
            <Ban className="h-3.5 w-3.5" /> Engelle
          </button>
        </div>
      )}
    </div>
  );
}