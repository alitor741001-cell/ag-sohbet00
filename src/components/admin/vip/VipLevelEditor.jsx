export default function VipLevelEditor({ theme, onChange }) {
  return <details className="rounded-xl border border-border p-3">
    <summary className="cursor-pointer text-sm font-bold">VIP {theme.level} · {theme.name}</summary>
    <div className="mt-3 grid gap-2 text-xs">
      <label>Tema adı<input value={theme.name} maxLength={60} onChange={(event) => onChange({ name: event.target.value })} className="mt-1 w-full rounded-lg bg-secondary p-2" /></label>
      <label>Üyelik süresi (gün)<input type="number" min="1" max="365" value={theme.days} onChange={(event) => onChange({ days: Number(event.target.value) })} className="mt-1 w-full rounded-lg bg-secondary p-2" /></label>
      <label>Ejderha görseli (HTTPS)<input type="url" value={theme.image} onChange={(event) => onChange({ image: event.target.value })} className="mt-1 w-full rounded-lg bg-secondary p-2" /></label>
      <div className="flex gap-4"><label>Ana renk<input type="color" value={theme.accent} onChange={(event) => onChange({ accent: event.target.value })} className="ml-2 align-middle" /></label><label>Vurgu<input type="color" value={theme.secondary} onChange={(event) => onChange({ secondary: event.target.value })} className="ml-2 align-middle" /></label></div>
    </div>
  </details>;
}