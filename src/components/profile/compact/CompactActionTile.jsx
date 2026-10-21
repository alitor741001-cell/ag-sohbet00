/** Kompakt profil kartının alt işlem şeridi için tek düğme: ikon + kısa etiket. */
export default function CompactActionTile({ icon: Icon, label, onClick, disabled = false, danger = false, active = false, palette }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="flex min-w-0 flex-1 basis-[calc(25%-0.35rem)] flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 text-[10px] font-black leading-tight text-white active:scale-95 disabled:opacity-40"
      style={{
        borderColor: danger ? palette.danger : active ? palette.accent : palette.soft,
        background: active ? palette.soft : 'rgba(0,0,0,0.45)',
        color: danger ? palette.danger : '#fff',
        boxShadow: active ? `0 0 16px -6px ${palette.glow}` : 'none',
      }}
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
      <span className="max-w-full text-center">{label}</span>
    </button>
  );
}