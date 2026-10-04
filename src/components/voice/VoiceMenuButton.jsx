/** Koyu altın menü düğmesi: kenarlıklı, ortalanmış, tam genişlik. */
export default function VoiceMenuButton({ icon: Icon, label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border border-[#4D443D] bg-white/[0.04] px-4 py-3.5 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-40 ${danger ? 'text-[#D66868]' : 'text-[#D9C496]'}`}
    >
      {Icon && <Icon className="h-4 w-4" />} {label}
    </button>
  );
}