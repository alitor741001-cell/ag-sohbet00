/**
 * PK davet ve başlatma isteği kartı: profil fotoğrafı, başlık ve iki eylem.
 * Karşı tarafa düşen kabul/red isteği ile gönderilen isteğin durumu aynı kartla gösterilir.
 */
export default function PkActionCard({
  title, name, avatar, note,
  primaryLabel, onPrimary,
  secondaryLabel, onSecondary,
  onOpenProfile, busy = false,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-fuchsia-400/40 bg-gradient-to-br from-[#2a1233]/98 to-[#1c0f26]/98 shadow-[0_14px_44px_-12px_rgba(217,70,239,0.9)]">
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          onClick={onOpenProfile}
          disabled={!onOpenProfile}
          className="shrink-0 active:scale-95"
          aria-label="Profili aç"
        >
          {avatar
            ? <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-fuchsia-400/60" />
            : <span className="block h-10 w-10 rounded-full bg-white/15" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[9.5px] font-black uppercase tracking-wide text-fuchsia-300">{title}</p>
          <p className="truncate text-[13px] font-bold text-white">{name || 'Kullanıcı'}</p>
          {note && <p className="mt-0.5 truncate text-[9.5px] font-semibold text-white/55">{note}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
        {secondaryLabel && (
          <button
            type="button"
            onClick={onSecondary}
            disabled={busy}
            className="h-8 flex-1 rounded-xl bg-white/12 text-[10.5px] font-black text-white active:scale-95 disabled:opacity-50"
          >
            {secondaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onPrimary}
          disabled={busy}
          className="h-8 flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 text-[10.5px] font-black text-black active:scale-95 disabled:opacity-50"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}