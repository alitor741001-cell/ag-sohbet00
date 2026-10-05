import { memo } from 'react';
import { Shield, Trash2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import RoleBadge from '@/components/RoleBadge';
import RoleNameEffect from '@/components/role/RoleNameEffect';
import RoleMessageEffect from '@/components/role/RoleMessageEffect';
import UserBadgeRow from '@/components/status/UserBadgeRow';
import RoomLevelBadge from '@/components/status/RoomLevelBadge';
import { getRoleInfo, isModerator } from '@/lib/roles';
import { HIDDEN_AVATAR_URL, isHiddenName } from '@/lib/hiddenUser';

/**
 * Film odası sohbet satırı: sesli oda sohbetindeki gibi küçük yuvarlak profil,
 * isim ve tüm seviye rozetleri tek satırda yan yana durur.
 * Gizli kullanıcıda yalnızca kırmızı takma ad ve maskeli profil görünür, ek rozet çıkmaz.
 */
function RoomChatMessage({ message, profile, ownerId, roomModerators, currentUserId, canDelete, onDelete, onImage, onOpenProfile, level = 0 }) {
  const role = getRoleInfo(profile || message);
  const hidden = isHiddenName(message.user_name);
  const name = message.user_name || 'Kullanıcı';
  // Gizli kullanıcı: gerçek fotoğraf yerine maskeli profil görünür.
  const avatar = hidden ? HIDDEN_AVATAR_URL : (profile?.avatar || message.user_avatar);
  const isOwner = message.user_id === ownerId;
  const isMod = !isOwner && (roomModerators.includes(message.user_id) || isModerator(profile));
  const trimmed = (message.text || '').trim();
  const emoji = ['😂','❤️','🔥','👏','🎉','😍','😱','😢','👍','🍿','🎬','💀'].includes(trimmed);
  const emojiMotion = ['😂','👏','😢','👍'].includes(trimmed) ? 'anim-emoji-bounce' : ['❤️','🎉','😍','🍿'].includes(trimmed) ? 'anim-emoji-pulse' : 'anim-emoji-shake';
  return <article className="group flex w-full min-w-0 shrink-0 items-start gap-2">
    <button type="button" onClick={() => onOpenProfile?.(message.user_id)} className="mt-0.5 shrink-0" aria-label={`${name} profilini aç`}>
      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/10">
        {avatar
          ? <img src={avatar} alt="" referrerPolicy="no-referrer" draggable={false} className="h-full w-full object-cover object-center" />
          : <span className="text-[11px] font-bold text-white/80">{name.trim().charAt(0) || '?'}</span>}
      </span>
    </button>
    <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
        {!hidden && isMod && <Shield className="h-3 w-3 shrink-0 text-blue-400" />}
        <button type="button" onClick={() => onOpenProfile?.(message.user_id)} className="min-w-0 max-w-full break-words text-left text-xs font-semibold hover:underline [overflow-wrap:anywhere]">
          {hidden
            ? <span className="hidden-user-name">{name}</span>
            : <RoleNameEffect nameEffect={role.name_effect} color={role.color}>{name}{currentUserId === message.user_id && ' (Sen)'}</RoleNameEffect>}
        </button>
        {!hidden && isOwner && <span className="text-[10px] font-bold text-amber-400">Oda Sahibi</span>}
        {!hidden && profile && (profile.display_role || profile.custom_role?.name) && <RoleBadge user={profile} size="sm" showLabel={false} />}
        {/* LVL 1000 yönetici seviyesi mesajlarda yazılmaz. */}
        {!hidden && Number(level) < 1000 && <RoomLevelBadge level={level} />}
        {!hidden && <UserBadgeRow profile={profile} />}
      </div>
      <div className="isolate min-w-0 max-w-full overflow-hidden rounded-xl p-2">
        <RoleMessageEffect className="max-w-full min-w-0 align-top" roleKey={profile?.display_role || (profile?.custom_role?.name ? 'custom' : '')} msgEffect={role.msg_effect} msgColor={role.color}>
          {message.file_url && <Image src={message.file_url} alt="Sohbet görseli" className="mb-1 block h-44 w-44 max-w-full cursor-pointer rounded-lg" fittingType="fit" onClick={() => onImage(message.file_url)} />}
          {message.text && <p className={`block h-auto max-w-full whitespace-pre-wrap break-words rounded-lg px-2.5 py-1.5 leading-relaxed [overflow-wrap:anywhere] ${emoji ? `text-3xl anim-emoji ${emojiMotion}` : 'text-sm'} bg-secondary text-secondary-foreground`} style={{ maxWidth: 'min(100%, calc(35ch + 1.25rem))' }}>{message.text}</p>}
        </RoleMessageEffect>
      </div>
    </div>
    {canDelete && <button onClick={() => onDelete(message.id)} className="shrink-0 self-start rounded p-1 text-muted-foreground opacity-60 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100" aria-label="Mesajı sil"><Trash2 className="h-3.5 w-3.5" /></button>}
  </article>;
}
export default memo(RoomChatMessage);