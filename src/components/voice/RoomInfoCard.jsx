import { useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { isHiddenName } from '@/lib/hiddenUser';
import useMessageProfiles from '@/hooks/useMessageProfiles';

// Bu uzunluktan sonra oda ismi soldan akmaya başlar.
const MARQUEE_AFTER = 10;

/**
 * Oda kimlik kartı: solda oda sahibinin profili; sağda oda ismi, kimlik numarası ve oda numarası yazar.
 * Kullanıcı adı gösterilmez; karta dokununca oda paneli açılır.
 */
export default function RoomInfoCard({ room, canEdit, onRename, onOpen }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(room?.name || '');
  const [saving, setSaving] = useState(false);

  const ownerId = room?.owner_id;
  const ids = useMemo(() => (ownerId ? [ownerId] : []), [ownerId]);
  const profile = useMessageProfiles(ids)[ownerId] || {};

  // Gizli kullanıcının odasında takma ad kalır; kimlik numarası yazılmaz.
  const ownerHidden = isHiddenName(room?.owner_name);
  const ownerName = ownerHidden
    ? room.owner_name
    : profile.username || room?.owner_name || profile.full_name || 'Kullanıcı';
  // Kullanıcının kimlik numarası: profil kartlarındaki üye numarasının aynısıdır.
  const memberId = !ownerHidden && profile.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';
  const label = room?.name || 'Oda';
  const scrolls = label.length > MARQUEE_AFTER;
  // Oda numarası: özel oda kodu varsa o, yoksa oda numarası yazılır.
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
    <div
      role="button"
      tabIndex={0}
      onClick={() => { if (!editing) onOpen?.(); }}
      onKeyDown={(event) => { if (!editing && (event.key === 'Enter' || event.key === ' ')) onOpen?.(); }}
      className={`relative flex min-h-[60px] w-[12.5rem] min-w-0 max-w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.07] py-2 pl-2.5 transition-transform active:scale-[0.99] ${editing || !canEdit ? 'pr-3' : 'pr-10'}`}
    >
      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/10">
        {profile.avatar
          ? <Image src={profile.avatar} alt={ownerName} className="h-full w-full" fittingType="fill" draggable={false} />
          : <span className="text-base font-bold text-white/80">{ownerName.trim().charAt(0)}</span>}
      </span>

      <div className="min-w-0 flex-1">
        {editing ? (
          <form onSubmit={submit} className="flex flex-col gap-1">
            <input
              autoFocus
              value={draft}
              maxLength={80}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Oda ismi"
              className="h-8 w-full min-w-0 rounded-lg bg-black/40 px-2 text-sm font-bold text-white outline-none placeholder:text-white/40"
            />
            <span className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving || !draft.trim()}
                className="rounded-lg bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground disabled:opacity-50"
              >
                Kaydet
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-[10px] font-bold text-white/60">İptal</button>
            </span>
          </form>
        ) : (
          <>
            {scrolls ? (
              <span className="room-name-fade block w-full overflow-hidden">
                <span
                  className="room-name-marquee flex w-max whitespace-nowrap"
                  style={{ animationDuration: `${Math.max(8, label.length * 0.5)}s` }}
                >
                  <span className="pr-8 text-sm font-bold">{label}</span>
                  <span className="pr-8 text-sm font-bold" aria-hidden="true">{label}</span>
                </span>
              </span>
            ) : (
              <span className="block w-full truncate text-sm font-bold">{label}</span>
            )}
            {/* Kullanıcı adı kartta yazmaz: oda isminin altında kimlik ve oda numarası kalır. */}
            {memberId && (
              <span className="mt-0.5 block w-full truncate text-[11px] leading-tight tabular-nums text-white/60">
                ID:{memberId}
              </span>
            )}
            {code && (
              <span className="mt-0.5 block w-full truncate text-[10px] leading-tight tabular-nums text-white/45">
                Oda No: {code}
              </span>
            )}
          </>
        )}
      </div>

      {canEdit && !editing && (
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); setEditing(true); }}
          aria-label="Oda ismini değiştir"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/75 transition-transform active:scale-95"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}