import { memo } from 'react';
import RoleBadge from '@/components/RoleBadge';
import RoleNameEffect from '@/components/role/RoleNameEffect';
import UserStatusBadges from '@/components/status/UserStatusBadges';
import { getRoleInfo, isModerator } from '@/lib/roles';
import { plainText } from '@/components/voice/voiceText';

/** Sohbet satırı: üye no, rol ve durum rozetleri + renkli isim + mesaj. */
function VoiceChatMessage({ message, profile, ownerId, moderators = [], currentUserId, onOpenProfile }) {
  const role = getRoleInfo(profile || message);
  const memberId = profile?.member_id && profile.member_id !== '-' ? profile.member_id : '';
  const isOwner = message.user_id === ownerId;
  const isMod = !isOwner && (moderators.includes(message.user_id) || isModerator(profile));
  const name = message.user_name || 'Kullanıcı';
  const label = isOwner ? 'Oda Sahibi' : isMod ? 'Yönetici' : '';

  return (
    <article className="flex min-w-0 items-start gap-2 text-sm leading-relaxed [overflow-wrap:anywhere] [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
      <button type="button" onClick={() => onOpenProfile?.(message.user_id)} className="mt-0.5 shrink-0" aria-label={`${name} profilini aç`}>
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/10">
          {profile?.avatar
            ? <img src={profile.avatar} alt="" referrerPolicy="no-referrer" draggable={false} className="h-full w-full object-cover object-center" />
            : <span className="text-[11px] font-bold text-white/80">{name.trim().charAt(0) || '?'}</span>}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
          <button type="button" onClick={() => onOpenProfile?.(message.user_id)} className="min-w-0 max-w-full break-words text-left text-xs font-bold hover:underline [overflow-wrap:anywhere]">
            <RoleNameEffect nameEffect={role.name_effect} color={role.color} className={role.name_effect ? undefined : 'text-white'}>
              {name}{message.user_id === currentUserId && ' (Sen)'}
            </RoleNameEffect>
          </button>
          {memberId && <span className="rounded border border-white/25 bg-white/10 px-1 text-[9px] font-black leading-4 text-white/85">#{memberId}</span>}
          {label && <span className={`text-[10px] font-bold ${isOwner ? 'text-amber-400' : 'text-sky-400'}`}>{label}</span>}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1">
          <RoleBadge user={profile} size="sm" />
          <UserStatusBadges
            showUserIcon
            n_level={profile?.n_level || 0}
            vip_level={profile?.vip_level || 0}
            vip_days_left={profile?.vip_days_left || 0}
            gift_sent_level={profile?.gift_sent_level || 0}
            gift_sent_tier={profile?.gift_sent_tier || 'green'}
            gift_received_level={profile?.gift_received_level || 0}
            gift_received_tier={profile?.gift_received_tier || 'green'}
          />
        </div>

        <p className="mt-1 whitespace-pre-wrap text-white">{plainText(message.text)}</p>
      </div>
    </article>
  );
}

export default memo(VoiceChatMessage);