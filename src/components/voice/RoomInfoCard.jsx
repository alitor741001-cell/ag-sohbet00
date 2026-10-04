import { useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Image } from '@/components/ui/image';
import RoleNameEffect from '@/components/role/RoleNameEffect';
import { getRoleInfo } from '@/lib/roles';
import useMessageProfiles from '@/hooks/useMessageProfiles';

// Bu uzunluktan sonra oda ismi soldan akmaya başlar.
const MARQUEE_AFTER = 10;

/**
 * Oda kimlik kartı: solda oda sahibinin profili, sağda oda ismi ile oda sahibinin
 * adı ve oda kimlik numarası. İsim 10 harften uzunsa sağ kenarda sönümlenerek akar.
 */
export default function RoomInfoCard({ room, canEdit, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(room?.name || '');
  const [saving, setSaving] = useState(false);

  const ownerId = room?.owner_id;
  const ids = useMemo(() => (ownerId ? [ownerId] : []), [ownerId]);
  const profile = useMessageProfiles(ids)[ownerId] || {};

  const role = getRoleInfo(profile);
  const ownerName = profile.username || room?.owner_name || profile.full_name || 'Kullanıcı';
  const label = room?.name || 'Oda';
  const scrolls = label.length > MARQUEE_AFTER;
  // Kimlik numarası: özel oda kodu varsa o, yoksa oda numarası yazılır.
  const code = room?.personal_room_code || (room?.room_number ? String(room.room_number) : '');

  // Oda ismi başka yerden değişirse kart kendini günceller.
  useEffect(() => { if (!editing) setDraft(room?.name || ''); }, [room?.name, editing]);

  const submit = async (event) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setSaving(true);
    const ok = await onRename(value);
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <div className={`relative mt-2 flex w-fit max-w-[92vw] items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.07] py-2 pl-2.5 ${canEdit ? 'pr-10' : 'pr-3'}`}>
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/10">
        {profile.avatar
          ? <Image src={profile.avatar} alt={ownerName} className="h-full w-full" fittingType="fill" draggable={false} />
          : <span className="text-sm font-bold text-white/80">{ownerName.trim().charAt(0)}</span>}
      </span>

      <div className="min-w-0">
        {editing ? (
          <form onSubmit={submit} className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              maxLength={80}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Oda ismi"
              className="h-8 w-[40vw] max-w-[13rem] rounded-lg bg-black/40 px-2.5 text-sm font-bold text-white outline-none placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={saving || !draft.trim()}
              className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
            >
              Kaydet
            </button>
            <button type="button" onClick={() => setEditing(false)} className="shrink-0 text-[11px] font-bold text-white/60">İptal</button>
          </form>
        ) : (
          <>
            {scrolls ? (
              <span className="room-name-fade block overflow-hidden" style={{ maxWidth: '50vw' }}>
                <span
                  className="room-name-marquee flex w-max whitespace-nowrap"
                  style={{ animationDuration: `${Math.max(8, label.length * 0.5)}s` }}
                >
                  <span className="pr-8 text-sm font-bold">{label}</span>
                  <span className="pr-8 text-sm font-bold" aria-hidden="true">{label}</span>
                </span>
              </span>
            ) : (
              <span className="block max-w-[50vw] truncate text-sm font-bold">{label}</span>
            )}
            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-none">
              <RoleNameEffect
                nameEffect={role.name_effect}
                color={role.color}
                className={`min-w-0 truncate ${role.name_effect ? '' : 'text-white/80'}`}
              >
                {ownerName}
              </RoleNameEffect>
              {code && (
                <>
                  <span className="shrink-0 text-white/35">·</span>
                  <span className="shrink-0 tabular-nums text-white/60">ID:{code}</span>
                </>
              )}
            </span>
          </>
        )}
      </div>

      {canEdit && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Oda ismini değiştir"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/75 transition-transform active:scale-95"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}