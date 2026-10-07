import { Image } from '@/components/ui/image';

/** Oda sahibi / yönetici satırı: profil resmi ve ismi gösterir, dokununca profil kartı açılır. */
export default function RoomPersonRow({ id, name, avatar, label, icon: Icon, tone = 'text-amber-400', canRemove = false, onOpenProfile, onRemove }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-black/30 p-1.5">
      <button
        type="button"
        onClick={() => onOpenProfile?.(id)}
        aria-label={`${name} profilini aç`}
        className="flex min-w-0 flex-1 items-center gap-2 text-left transition-transform active:scale-[0.99]"
      >
        <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10">
          {avatar
            ? <Image src={avatar} alt="" className="h-full w-full overflow-hidden rounded-full" fittingType="fill" draggable={false} />
            : <span className="text-sm font-bold text-white/80">{(name || 'K').trim().charAt(0)}</span>}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/85">
            <Icon className={`h-2.5 w-2.5 ${tone}`} />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-white/50">{label}</span>
          <span className="block truncate text-sm font-bold text-white">{name}</span>
        </span>
      </button>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove?.(id)}
          className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white transition-transform active:scale-95"
        >
          Sil
        </button>
      )}
    </div>
  );
}