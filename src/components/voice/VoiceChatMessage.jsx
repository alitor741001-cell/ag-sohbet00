import { memo } from 'react';
import { Crown, Shield } from 'lucide-react';
import RoleBadge from '@/components/RoleBadge';
import RoleNameEffect from '@/components/role/RoleNameEffect';
import RoomLevelBadge from '@/components/levels/RoomLevelBadge';
import { getRoleInfo, isModerator } from '@/lib/roles';
import { plainText } from '@/components/voice/voiceText';

/** Sohbet satırı: üye no, rol ve seviye rozetleri + renkli isim + mesaj. */
function VoiceChatMessage({ message, profile, level, ownerId, moderators = [], currentUserId, onOpenProfile }) {
  const role = getRoleInfo(profile || message);
  const memberId = profile?.member_id && profile.member_id !== '-' ? profile.member_id : '';
  const isOwner = message.user_id === ownerId;
  const isMod = !isOwner && (moderators.includes(message.user_id) || isModerator(profile));

  return (
    <article className="min-w-0 text-sm leading-relaxed [overflow-wrap:anywhere] [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
      {memberId && <span className="mr-1 inline-block rounded border border-white/25 bg-white/10 px-1 align-middle text-[9px] font-black leading-4 text-white/85">#{memberId}</span>}
      <RoleBadge user={profile} size="sm" className="mr-1 align-middle" />
      <span className="mr-1 inline-block h-[30px] w-[54px] shrink-0 overflow-hidden align-middle">
        <span className="block origin-top-left scale-[0.36]"><RoomLevelBadge level={level} /></span>
      </span>
      {isOwner && <Crown className="mr-0.5 inline h-3 w-3 align-middle text-amber-400" />}
      {isMod && <Shield className="mr-0.5 inline h-3 w-3 align-middle text-sky-400" />}
      <button type="button" onClick={() => onOpenProfile?.(message.user_id)} className="align-middle text-xs font-bold hover:underline">
        <RoleNameEffect nameEffect={role.name_effect} color={role.color} className={role.name_effect ? undefined : 'text-white'}>
          {message.user_name || 'Kullanıcı'}{message.user_id === currentUserId && ' (Sen)'}
        </RoleNameEffect>
      </button>
      <span className="mx-1 text-white/50">:</span>
      <span className="text-white">{plainText(message.text)}</span>
    </article>
  );
}

export default memo(VoiceChatMessage);