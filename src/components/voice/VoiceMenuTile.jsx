/** Oda ayarları ızgarasındaki yuvarlak ikon düğmesi — ikon dairenin içinde, etiketi altında. */
export default function VoiceMenuTile({ icon: Icon, label, onClick, active, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={!!active}
      className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-40"
    >
      <span className={`flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${active ? 'border-primary/70 bg-primary/20 text-primary' : 'border-white/10 bg-white/10 text-white'}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span className={`max-w-[72px] text-center text-[11px] font-semibold leading-tight ${active ? 'text-primary' : 'text-white/75'}`}>{label}</span>
    </button>
  );
}