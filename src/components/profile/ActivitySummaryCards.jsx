/**
 * Panel üstü özet kartları: "Toplam" ve "24 saatlik" gibi iki değer yan yana gösterilir.
 */
export default function ActivitySummaryCards({ items }) {
  return (
    <div className="mb-2.5 grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-xl bg-white/5 px-2.5 py-2 text-center">
          <p className="truncate text-[10px] font-semibold text-white/45">{item.label}</p>
          <p className="truncate text-sm font-bold tabular-nums text-amber-400">{item.value}</p>
          {item.hint ? <p className="truncate text-[10px] tabular-nums text-white/45">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}