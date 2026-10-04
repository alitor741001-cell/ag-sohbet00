import { useMemo } from 'react';
import RoleNameEffect from '@/components/role/RoleNameEffect';
import { getRoleInfo } from '@/lib/roles';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { Image } from '@/components/ui/image';

/** Oda başlığındaki oda açan kişi: büyükçe yuvarlak profil ve renkli isim (seviye rozeti yok). */
export default function VoiceOwnerBadge({ userId, fallbackName }) {
  const ids = useMemo(() => (userId ? [userId] : []), [userId]);
  const profiles = useMessageProfiles(ids);

  const profile = profiles[userId] || {};
  const role = getRoleInfo(profile);
  const name = profile.username || fallbackName || profile.full_name || 'Kullanıcı';

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
        {profile.avatar
          ? <Image src={profile.avatar} alt={name} className="h-full w-full" fittingType="fill" draggable={false} />
          : <span className="text-sm font-bold text-white/80">{name.trim().charAt(0)}</span>}
      </span>
      <RoleNameEffect
        nameEffect={role.name_effect}
        color={role.color}
        className={`min-w-0 truncate text-sm font-bold ${role.name_effect ? '' : 'text-white'}`}
      >
        {name}
      </RoleNameEffect>
    </div>
  );
}