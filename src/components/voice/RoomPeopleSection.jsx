import { Crown, Shield, Trash2 } from 'lucide-react';
import useMessageProfiles from '@/hooks/useMessageProfiles';

/** Oda sahibi ve yöneticiler: satıra dokununca profil kartı açılır, "Sil" yetkiyi kaldırır. */
export default function RoomPeopleSection({ ownerId, ownerName, moderators = [], canMod = false, onOpenProfile, onRemove }) {
  const profiles = useMessageProfiles([ownerId, ...moderators].filter(Boolean));
  const nameOf = (id, fallback) => profiles[id]?.username || profiles[id]?.full_name || fallback || 'Kullanıcı';

  return (
    <section className="mt-3 space-y-2.5">
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/50">Oda Sahibi</p>
        <div className="flex items-center gap-2 rounded-xl bg-black/30 px-2.5 py-2">
          <button type="button" onClick={() => onOpenProfile?.(ownerId)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
            <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span className="truncate text-sm text-white">{nameOf(ownerId, ownerName)}</span>
          </button>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/50">Yöneticiler</p>
        {moderators.length === 0 ? (
          <p className="text-xs text-white/50">Henüz yönetici yok.</p>
        ) : (
          <div className="space-y-1.5">
            {moderators.map((id) => (
              <div key={id} className="flex items-center gap-2 rounded-xl bg-black/30 px-2.5 py-2">
                <button type="button" onClick={() => onOpenProfile?.(id)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                  <span className="truncate text-sm text-white">{nameOf(id)}</span>
                </button>
                {canMod && (
                  <button
                    type="button"
                    onClick={() => onRemove?.(id)}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white transition-transform active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Sil
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}