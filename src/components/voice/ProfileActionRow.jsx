/** Profil altındaki eylem satırı: simge + etiket, eşit aralıklı. */
export default function ProfileActionRow({ items = [] }) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-1 border-t border-[#E5E5E5] pt-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onClick}
          disabled={item.disabled}
          className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold text-[#2c2e3a] transition-transform active:scale-95 disabled:opacity-35"
        >
          <item.icon className="h-6 w-6" />
          <span className="max-w-full text-center leading-tight">{item.label}</span>
        </button>
      ))}
    </div>
  );
}