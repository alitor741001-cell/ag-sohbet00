/** Beyaz menü düğmesi: kenarlıklı, ortalanmış, tam genişlik. */
export default function VoiceMenuButton({ icon: Icon, label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E5E5] bg-white px-4 py-3.5 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-40 ${danger ? 'text-red-600' : 'text-[#1F2024]'}`}
    >
      {Icon && <Icon className="h-4 w-4" />} {label}
    </button>
  );
}