import { memo } from 'react';
import { Image } from '@/components/ui/image';
import RoleNameEffect from '@/components/role/RoleNameEffect';
import UserBadgeRow from '@/components/status/UserBadgeRow';
import { getRoleInfo, isModerator } from '@/lib/roles';
import { plainText } from '@/components/voice/voiceText';
import { HIDDEN_AVATAR_URL, isHiddenName } from '@/lib/hiddenUser';
import VipChatBubble from '@/components/vip/VipChatBubble';
import { vipLook, vipVars } from '@/components/vip/vipTheme';

/** Sohbet satırı: üye no, rol ve durum rozetleri + renkli isim + mesaj. */
function VoiceChatMessage({ message, profile, ownerId, moderators = [], currentUserId, onOpenProfile }) {
  const role = getRoleInfo(profile || message);
  const isOwner = message.user_id === ownerId;
  const isMod = !isOwner && (moderators.includes(message.user_id) || isModerator(profile));
  const name = message.user_name || 'Kullanıcı';
  // Gizli kullanıcı: maskeli profil ve kırmızı takma ad görünür.
  const hidden = isHiddenName(name);
  const label = isOwner ? 'Oda Sahibi' : isMod ? 'Yönetici' : '';
  // Özel sohbetle aynı düzen: kendi mesajım sağda ve renkli balonda.
  const mine = !!currentUserId && message.user_id === currentUserId;

  return (
    <article className={`flex min-w-0 items-start gap-2 text-sm leading-relaxed [overflow-wrap:anywhere] [text-shadow:0_1px_4px_rgba(0,0,0,0.9)] ${mine ? 'flex-row-reverse text-right' : ''}`}>
      <span onClick={() => onOpenProfile?.(message.user_id)} className="mt-0.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/10">
        {hidden || profile?.avatar
          ? <Image src={hidden ? HIDDEN_AVATAR_URL : profile.avatar} alt="" referrerPolicy="no-referrer" draggable={false} fittingType="fill" className="h-full w-full" />
          : <span className="text-[11px] font-bold text-white/80">{name.trim().charAt(0) || '?'}</span>}
      </span>

      <div className="min-w-0 flex-1">
        <div className={`flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 ${mine ? 'justify-end' : ''}`}>
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

        <div className={`mt-1 flex flex-wrap items-center gap-1 ${mine ? 'justify-end' : ''}`}>
          <UserBadgeRow profile={profile} />
        </div>

        <VipChatBubble theme={!hidden && vipLook(profile, 'bubble')}><p className={`mt-1 whitespace-pre-wrap text-white ${mine ? 'inline-block max-w-full rounded-xl border border-primary/45 bg-primary/25 px-3 py-1.5' : ''}`}>{plainText(message.text)}</p></VipChatBubble>
      </div>
    </article>
  );
}

export default memo(VoiceChatMessage);