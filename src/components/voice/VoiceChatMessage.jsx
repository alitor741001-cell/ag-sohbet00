import { memo } from 'react';
import { Image } from '@/components/ui/image';
import RoleNameEffect from '@/components/role/RoleNameEffect';
import UserBadgeRow from '@/components/status/UserBadgeRow';
import { getRoleInfo, isModerator } from '@/lib/roles';
import { plainText } from '@/components/voice/voiceText';
import { HIDDEN_AVATAR_URL, isHiddenName } from '@/lib/hiddenUser';

/** Sohbet satırı: üye no, rol ve durum rozetleri + renkli isim + mesaj. */
function VoiceChatMessage({ message, profile, ownerId, moderators = [], currentUserId }) {
  const role = getRoleInfo(profile || message);
  const isOwner = message.user_id === ownerId;
  const isMod = !isOwner && (moderators.includes(message.user_id) || isModerator(profile));
  const name = message.user_name || 'Kullanıcı';
  // Gizli kullanıcı: maskeli profil ve kırmızı takma ad görünür.
  const hidden = isHiddenName(name);
  const label = isOwner ? 'Oda Sahibi' : isMod ? 'Yönetici' : '';

  return (
    <article className="flex min-w-0 items-start gap-2 text-sm leading-relaxed [overflow-wrap:anywhere] [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/10">
        {hidden || profile?.avatar
          ? <Image src={hidden ? HIDDEN_AVATAR_URL : profile.avatar} alt="" referrerPolicy="no-referrer" draggable={false} fittingType="fill" className="h-full w-full" />
          : <span className="text-[11px] font-bold text-white/80">{name.trim().charAt(0) || '?'}</span>}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
          <span className="min-w-0 max-w-full break-words text-left text-xs font-bold [overflow-wrap:anywhere]">
            {hidden ? (
              <span className="hidden-user-name">{name}</span>
            ) : (
              <RoleNameEffect nameEffect={role.name_effect} color={role.color} className={role.name_effect ? undefined : 'text-white'}>
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

        <p className="mt-1 whitespace-pre-wrap text-white">{plainText(message.text)}</p>
      </div>
    </article>
  );
}

export default memo(VoiceChatMessage);