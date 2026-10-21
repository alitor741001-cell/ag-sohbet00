import { Loader2 } from 'lucide-react';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

/** Referanstaki yuvarlak düğme: altın kenar, yoğun mavi ışıma ve altında küçük etiket. */
export default function CrystalCircleButton({
  icon: Icon, label = '', onClick, disabled = false, active = false, loading = false, danger = false, tone = 'blue',
}) {
  const c = crystalSkin(tone);
  const edge = danger ? 'rgba(248,113,113,0.9)' : c.edge;
  const ring = danger ? 'rgba(248,113,113,0.7)' : c.blueEdge;
  const color = danger ? '#f87171' : c.gold;

  return (
    <div className="flex w-[50px] shrink-0 flex-col items-center gap-[3px]">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        aria-pressed={active}
        aria-label={label}
        className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 active:scale-95 disabled:opacity-40"
        style={{
          borderColor: edge,
          background: c.glass,
          boxShadow: active
            ? `0 0 22px -2px ${c.glow}, 0 0 0 1.5px ${ring}, inset 0 0 16px -6px ${c.glow}`
            : `0 0 0 1.5px ${ring}, 0 0 18px -5px ${c.glow}, inset 0 0 16px -8px ${c.glow}`,
        }}
      >
        <span className="pointer-events-none absolute -top-[3px] left-1/2 h-[3px] w-[9px] -translate-x-1/2 rounded-full" style={{ background: edge }} />
        <span className="pointer-events-none absolute -bottom-[3px] left-1/2 h-[3px] w-[9px] -translate-x-1/2 rounded-full" style={{ background: edge }} />
        {loading
          ? <Loader2 className="h-[16px] w-[16px] animate-spin text-white" />
          : <Icon className="h-[17px] w-[17px]" strokeWidth={2} style={{ color }} />}
      </button>
      {label && (
        <span className="max-w-[52px] text-center text-[7.5px] font-black leading-[1.15]" style={{ color: danger ? '#fecaca' : c.gold }}>
          {label}
        </span>
      )}
    </div>
  );
}