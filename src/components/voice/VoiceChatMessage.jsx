import { memo, useRef, useState } from 'react';
import { AtSign } from 'lucide-react';
import { Image } from '@/components/ui/image';
import RoleNameEffect from '@/components/role/RoleNameEffect';
import UserBadgeRow from '@/components/status/UserBadgeRow';
import { getRoleInfo, isModerator } from '@/lib/roles';
import { plainText } from '@/components/voice/voiceText';
import { HIDDEN_AVATAR_URL, isHiddenName } from '@/lib/hiddenUser';
import VipChatBubble from '@/components/vip/VipChatBubble';
import { vipLook, vipVars } from '@/components/vip/vipTheme';

// Etiketler (@isim) mesaj metninde ayrı parça olarak gösterilir.
const MENTION_RE = /(@[A-Za-zÀ-ÿ0-9_.-]+)/g;
// Sağa kaydırma eşiği: bu kadar çekilince mesaj sahibi otomatik etiketlenir.
const SWIPE_LIMIT = 84;
const SWIPE_TRIGGER = 56;

/** Sohbet satırı: üye no, rol ve durum rozetleri + renkli isim + mesaj. */
function VoiceChatMessage({ message, profile, ownerId, moderators = [], currentUserId, currentUserName = '', onOpenProfile, onMention }) {
  const role = getRoleInfo(profile || message);
  const isOwner = message.user_id === ownerId;
  const isMod = !isOwner && (moderators.includes(message.user_id) || isModerator(profile));
  const name = message.user_name || 'Kullanıcı';
  // Gizli kullanıcı: maskeli profil ve kırmızı takma ad görünür.
  const hidden = isHiddenName(name);
  const label = isOwner ? 'Oda Sahibi' : isMod ? 'Yönetici' : '';
  // Özel sohbetle aynı düzen: kendi mesajım sağda ve renkli balonda.
  const mine = !!currentUserId && message.user_id === currentUserId;
  const text = plainText(message.text);
  // Etiketlenen kişi mesajın kime ait olduğunu görsün: adı @ ile geçiyorsa işaretlenir.
  const myTag = currentUserName ? `@${currentUserName}` : '';
  const taggedMe = !!myTag && !mine && text.includes(myTag);

  const rootRef = useRef(null);
  const [flash, setFlash] = useState(false);
  const [drag, setDrag] = useState(0);
  const gesture = useRef({ x: 0, y: 0, active: false, locked: false, offset: 0 });

  // "Seni etiketledi": mesaj yukarıda kaldıysa görünür alana kaydırılır.
  const jumpToMention = () => {
    rootRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setFlash(true);
    window.setTimeout(() => setFlash(false), 1200);
  };

  // Sağa kaydırma: dikey kaydırma bozulmaz, yatay hareket algılanınca mesaj sağa kayar.
  const onTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (!touch || !onMention || mine) return;
    gesture.current = { x: touch.clientX, y: touch.clientY, active: true, locked: false, offset: 0 };
  };
  const onTouchMove = (event) => {
    const state = gesture.current;
    if (!state.active) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    const dx = touch.clientX - state.x;
    const dy = touch.clientY - state.y;
    if (!state.locked) {
      if (Math.abs(dy) > Math.abs(dx)) { state.active = false; return; }
      if (dx < 8) return;
      state.locked = true;
    }
    state.offset = Math.max(0, Math.min(dx, SWIPE_LIMIT));
    setDrag(state.offset);
  };
  const onTouchEnd = () => {
    const state = gesture.current;
    const offset = state.offset;
    state.active = false;
    state.locked = false;
    state.offset = 0;
    setDrag(0);
    if (offset >= SWIPE_TRIGGER) onMention?.(name);
  };

  return (
    <div ref={rootRef} className="relative min-w-0" style={{ touchAction: 'pan-y' }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      {drag > 0 && (
        <span className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[#FFD700]" style={{ opacity: Math.min(drag / SWIPE_TRIGGER, 1) }}>
          <AtSign className="h-4 w-4" />
        </span>
      )}
      <article
        className={`flex min-w-0 items-start gap-2 text-sm leading-relaxed [overflow-wrap:anywhere] [text-shadow:0_1px_4px_rgba(0,0,0,0.9)] ${flash ? 'rounded-lg bg-[#FFD700]/15 ring-1 ring-[#FFD700]/70' : ''}`}
        style={{ transform: `translateX(${drag}px)`, transition: drag ? 'none' : 'transform 160ms ease-out' }}
      >
        {/* Tüm mesajlar solda durur: profil resmi ve yazan kişinin adı solda, metin sağında. */}
        <span onClick={() => onOpenProfile?.(message.user_id)} className="mt-0.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/10">
          {hidden || profile?.avatar
            ? <Image src={hidden ? HIDDEN_AVATAR_URL : profile.avatar} alt="" referrerPolicy="no-referrer" draggable={false} fittingType="fill" className="h-full w-full" />
            : <span className="text-[11px] font-bold text-white/80">{name.trim().charAt(0) || '?'}</span>}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
            <span onClick={() => onOpenProfile?.(message.user_id)} style={vipVars(!hidden && vipLook(profile, 'name'))} className={`min-w-0 max-w-full cursor-pointer break-words text-left text-xs font-bold [overflow-wrap:anywhere] ${!hidden && !role.name_effect && vipLook(profile, 'name')?.nameAnimated ? 'vip-name-animated' : ''}`}>
              {hidden ? (
                <span className="hidden-user-name">{name}</span>
              ) : (
                <RoleNameEffect nameEffect={role.name_effect} color={role.name_effect ? role.color : vipLook(profile, 'name')?.accent || role.color} className={role.name_effect ? undefined : vipLook(profile, 'name') ? undefined : 'text-white'}>
                  {name}
                </RoleNameEffect>
              )}
            </span>
            {label && <span className={`text-[10px] font-bold ${isOwner ? 'text-amber-400' : 'text-sky-400'}`}>{label}</span>}
            {/* Mesajlarda seviye rozeti gösterilmez. */}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1">
            <UserBadgeRow profile={profile} />
          </div>

          {taggedMe && (
            <button
              type="button"
              onClick={jumpToMention}
              className="mt-1 flex items-center gap-1 rounded-full border border-[#FFD700]/70 bg-[#FFD700]/15 px-2 py-0.5 text-[10px] font-bold text-[#FFD700] transition-transform active:scale-95"
            >
              <AtSign className="h-3 w-3" /> seni etiketledi
            </button>
          )}

          <VipChatBubble theme={!hidden && vipLook(profile, 'bubble')}>
            <p className="mt-1 whitespace-pre-wrap text-white">
              {text.split(MENTION_RE).map((part, index) => (
                part.startsWith('@')
                  ? <span key={index} className={`rounded px-0.5 font-bold ${part === myTag ? 'bg-[#FFD700]/25 text-[#FFD700]' : 'text-sky-300'}`}>{part}</span>
                  : <span key={index}>{part}</span>
              ))}
            </p>
          </VipChatBubble>
        </div>
      </article>
    </div>
  );
}

export default memo(VoiceChatMessage);