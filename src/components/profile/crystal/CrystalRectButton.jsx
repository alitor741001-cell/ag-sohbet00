import { Loader2 } from 'lucide-react';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

/** Referanstaki altın çerçeveli dikdörtgen düğme (mik, koltuk kilidi gibi oda işlemleri). */
export default function CrystalRectButton({
  icon: Icon, label, onClick, disabled = false, active = false, loading = false, danger = false, tone = 'blue',
}) {
  const c = crystalSkin(tone);
  const border = danger ? 'rgba(248,113,113,0.8)' : c.edge;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-pressed={active}
      className="flex h-[36px] min-w-0 items-center justify-center gap-1 rounded-[9px] border px-1 active:scale-95 disabled:opacity-40"
      style={{
        borderColor: border,
        background: c.glass,
        boxShadow: active ? `0 0 16px -3px ${c.glow}` : `inset 0 0 14px -8px ${c.glow}`,
      }}
    >
      {loading
        ? <Loader2 className="h-[14px] w-[14px] shrink-0 animate-spin text-white" />
        : <Icon className="h-[14px] w-[14px] shrink-0" strokeWidth={2} style={{ color: danger ? '#f87171' : c.gold }} />}
      <span className="truncate text-[9.5px] font-black leading-none" style={{ color: danger ? '#fecaca' : '#ffffff' }}>
        {label}
      </span>
    </button>
  );
}