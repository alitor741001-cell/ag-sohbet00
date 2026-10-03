import { useMemo } from 'react';
import RoleNameEffect from '@/components/role/RoleNameEffect';
import LevelSpriteBadge from '@/components/levels/LevelSpriteBadge';
import { getRoleInfo } from '@/lib/roles';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useRoomLevels from '@/hooks/useRoomLevels';

/** Oda başlığındaki oda açan kişi: küçük yuvarlak profil + seviye + renkli isim. */
export default function VoiceOwnerBadge({ userId, fallbackName }) {
  const ids = useMemo(() => (userId ? [userId] : []), [userId]);
  const profiles = useMessageProfiles(ids);
  const { levels } = useRoomLevels(ids);

  const profile = profiles[userId] || {};
  const role = getRoleInfo(profile);
  const name = profile.username || fallbackName || profile.full_name || 'Kullanıcı';
  const level = levels[userId];

  return (
    <span className="flex min-w-0 shrink items-center gap-1">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/10">
        {profile.avatar
          ? <img src={profile.avatar} alt="" referrerPolicy="no-referrer" draggable={false} className="h-full w-full object-cover object-center" />
          : <span className="text-[10px] font-bold text-white/80">{name.trim().charAt(0)}</span>}
      </span>
      {level !== undefined && (
        <span className="inline-block h-[20px] w-[36px] shrink-0 overflow-hidden">
          <span className="block origin-top-left scale-[0.28]"><LevelSpriteBadge level={level} /></span>
        </span>
      )}
      <RoleNameEffect
        nameEffect={role.name_effect}
        color={role.color}
        className={`inline-block max-w-[7rem] truncate align-middle text-[11px] font-bold ${role.name_effect ? '' : 'text-white'}`}
      >
        {name}
      </RoleNameEffect>
    </span>
  );
}