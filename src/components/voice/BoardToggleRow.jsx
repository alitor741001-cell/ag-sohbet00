/** Sayaç ayarı satırı: etiket ve açık/kapalı anahtarı. */
export default function BoardToggleRow({ label, value, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${value ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-white/15 bg-white/5 text-white/70'}`}
    >
      <span className="flex-1 text-left">{label}</span>
      <span className={`h-5 w-10 shrink-0 overflow-hidden rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-white/20'}`}>
        <span className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}