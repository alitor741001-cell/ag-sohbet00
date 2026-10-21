import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import { Image } from '@/components/ui/image';
import RoomCategoryChips from '@/components/voice/RoomCategoryChips';
import RoomAnnouncementField from '@/components/voice/RoomAnnouncementField';
import RoomPeopleSection from '@/components/voice/RoomPeopleSection';
import RoomLookEditor from '@/components/voice/RoomLookEditor';

/**
 * Oda paneli: en üstte profilim, altında oda ismi düzenleme, oda isim kartı, kategori
 * etiketleri, duyuru, oda sahibi ve yöneticiler. Telefonlarda ekranın yarısı kadar açılır.
 */
export default function RoomProfileSheet({ open, onClose, room, user, moderators = [], canMod = false, onRename, onSaveAnnouncement, onSaveCategory, onSaveLook, onOpenProfile, onRemoveMod }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(room?.name || '');

  // Oda ismi başka yerden değişirse alan kendini günceller.
  useEffect(() => { if (!editing) setDraft(room?.name || ''); }, [room?.name, editing]);
  useEffect(() => { if (!open) setEditing(false); }, [open]);

  const submit = async (event) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    const ok = await onRename?.(value);
    if (ok) setEditing(false);
  };

  const code = room?.personal_room_code || (room?.room_number ? String(room.room_number) : '');

  return (
    <VoiceSheet open={open} onClose={onClose} halfHeight title="Oda Profili">
      {/* Profilim: dokununca kendi profil kartı açılır. */}
      <button
        type="button"
        onClick={() => onOpenProfile?.(user?.id)}
        className="flex w-full items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-2 text-left transition-transform active:scale-[0.99]"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10">
          {user?.avatar
            ? <Image src={user.avatar} alt="" className="h-full w-full" fittingType="fill" draggable={false} />
            : <span className="text-sm font-bold text-white/80">{(user?.full_name || 'P').trim().charAt(0)}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-white/50">Profilim</span>
          <span className="block truncate text-sm font-bold text-white">{user?.full_name || 'Profilim'}</span>
        </span>
      </button>

      {canMod && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition-transform active:scale-95"
        >
          <Pencil className="h-3.5 w-3.5" /> Oda Adı Düzenle
        </button>
      )}

      {editing ? (
        <form onSubmit={submit} className="mt-2 flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            maxLength={80}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Oda ismi"
            className="h-9 min-w-0 flex-1 rounded-lg bg-black/40 px-2 text-sm font-bold text-white outline-none placeholder:text-white/40"
          />
          <button type="submit" disabled={!draft.trim()} className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50">Kaydet</button>
          <button type="button" onClick={() => setEditing(false)} className="shrink-0 text-[11px] font-bold text-white/60">İptal</button>
        </form>
      ) : (
        /* Oda isim kartı: oda ismi ve kimlik numarası. */
        <div className="mt-2 rounded-2xl border border-white/10 bg-[#171720] p-2.5">
          <span className="block truncate text-sm font-bold text-white">{room?.name || 'Oda'}</span>
          {code && <span className="mt-0.5 block truncate text-[11px] tabular-nums text-white/60">ID:{code}</span>}
        </div>
      )}

      {canMod && (
        <RoomLookEditor background={room?.background || ''} cover={room?.cover_url || ''} onSave={onSaveLook} />
      )}

      <RoomCategoryChips value={room?.category || ''} disabled={!canMod} onChange={onSaveCategory} />
      <RoomAnnouncementField value={room?.announcement || ''} canEdit={canMod} onSave={onSaveAnnouncement} />
      <RoomPeopleSection
        ownerId={room?.owner_id}
        ownerName={room?.owner_name}
        moderators={moderators}
        canMod={canMod}
        onOpenProfile={onOpenProfile}
        onRemove={onRemoveMod}
      />
    </VoiceSheet>
  );
}