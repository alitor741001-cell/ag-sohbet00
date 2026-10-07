import { Crown, Shield } from 'lucide-react';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import RoomPersonRow from '@/components/voice/RoomPersonRow';

/** Oda sahibi ve yöneticiler: profil resmi ve isimle listelenir, satıra dokununca profilleri açılır. */
export default function RoomPeopleSection({ ownerId, ownerName, moderators = [], canMod = false, onOpenProfile, onRemove }) {
  const profiles = useMessageProfiles([ownerId, ...moderators].filter(Boolean));
  const person = (id, fallback) => ({
    name: profiles[id]?.username || profiles[id]?.full_name || fallback || 'Kullanıcı',
    avatar: profiles[id]?.avatar || '',
  });
  const owner = person(ownerId, ownerName);

  return (
    <section className="mt-3 space-y-2.5">
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/50">Oda Sahibi</p>
        <RoomPersonRow
          id={ownerId}
          name={owner.name}
          avatar={owner.avatar}
          label="Oda sahibi"
          icon={Crown}
          onOpenProfile={onOpenProfile}
        />
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/50">Yöneticiler</p>
        {moderators.length === 0 ? (
          <p className="text-xs text-white/50">Henüz yönetici yok.</p>
        ) : (
          <div className="space-y-1.5">
            {moderators.map((id) => {
              const mod = person(id);
              return (
                <RoomPersonRow
                  key={id}
                  id={id}
                  name={mod.name}
                  avatar={mod.avatar}
                  label="Yönetici"
                  icon={Shield}
                  tone="text-sky-400"
                  canRemove={canMod}
                  onOpenProfile={onOpenProfile}
                  onRemove={onRemove}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}