import { Loader2 } from 'lucide-react';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

/** Referanstaki parlayan mavi köşeli dikdörtgen düğme (Mik aç, Koltuğu kilitle, Profili gör). */
export default function CrystalRectButton({
  icon: Icon, label, onClick, disabled = false, active = false, loading = false, danger = false, tone = 'blue',
}) {
  const c = crystalSkin(tone);
  const border = danger ? 'rgba(248,113,113,0.85)' : c.blueEdge;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-pressed={active}
      className="relative flex h-[42px] min-w-0 items-center justify-center gap-1 rounded-[10px] border-[1.5px] px-1 active:scale-95 disabled:opacity-40"
      style={{
        borderColor: border,
        background: c.glass,
        boxShadow: active
          ? `0 0 20px -3px ${c.glow}, inset 0 0 0 1px ${c.edge}`
          : `inset 0 0 20px -10px ${c.glow}, 0 0 12px -8px ${c.blue}`,
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-[18%] bottom-0 h-[1.5px] rounded-full"
        style={{ background: danger ? 'rgba(248,113,113,0.75)' : c.edge, opacity: 0.85 }}
      />
      {loading
        ? <Loader2 className="h-[15px] w-[15px] shrink-0 animate-spin text-white" />
        : <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={2} style={{ color: danger ? '#f87171' : c.gold }} />}
      <span className="truncate text-[9.5px] font-black leading-none text-white">
        {label}
      </span>
    </button>
  );
}