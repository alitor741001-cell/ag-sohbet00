import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import XpAvatar from '@/components/xp/XpAvatar';

/**
 * Oda sahibinin profil künyesi: şifreli oda ekranında odanın kime ait olduğu
 * fotoğraf ve isimle görünür.
 */
export default function RoomOwnerBadge({ ownerId, fallbackName = '', className = '' }) {
  const [owner, setOwner] = useState(null);

  useEffect(() => {
    if (!ownerId) return;
    let active = true;
    base44.functions.invoke('user-profile', { user_ids: [ownerId] })
      .then((response) => {
        if (!active) return;
        const map = response?.data?.data || response?.data || {};
        setOwner(map[ownerId] || null);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [ownerId]);

  if (!ownerId) return null;
  const name = owner?.username || owner?.full_name || fallbackName || 'Oda sahibi';

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <XpAvatar avatar={owner?.avatar || ''} name={name} size="md" />
      <p className="text-sm font-bold text-foreground">{name}</p>
      <p className="text-[10px] font-black tracking-[0.18em] text-premium-gold">ODA SAHİBİ</p>
    </div>
  );
}