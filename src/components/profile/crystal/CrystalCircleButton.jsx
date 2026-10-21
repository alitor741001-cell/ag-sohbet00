import { Loader2 } from 'lucide-react';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

/** Referanstaki yuvarlak kristal düğme: altın halka, lacivert gövde, altında küçük etiket. */
export default function CrystalCircleButton({
  icon: Icon, label = '', onClick, disabled = false, active = false, loading = false, danger = false, tone = 'blue',
}) {
  const c = crystalSkin(tone);
  const edge = danger ? 'rgba(248,113,113,0.85)' : c.edge;
  const color = danger ? '#f87171' : c.gold;

  return (
    <div className="flex w-[48px] shrink-0 flex-col items-center gap-[3px]">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        aria-pressed={active}
        aria-label={label}
        className="flex h-[40px] w-[40px] items-center justify-center rounded-full border-2 active:scale-95 disabled:opacity-40"
        style={{
          borderColor: edge,
          background: c.glass,
          boxShadow: active ? `0 0 18px -3px ${c.glow}` : `inset 0 0 14px -6px ${c.glow}, 0 0 12px -6px ${c.glow}`,
        }}
      >
        {loading ? <Loader2 className="h-[16px] w-[16px] animate-spin text-white" /> : <Icon className="h-[16px] w-[16px]" strokeWidth={2} style={{ color }} />}
      </button>
      {label && (
        <span className="max-w-[50px] text-center text-[7.5px] font-black leading-[1.15]" style={{ color: danger ? '#fecaca' : c.gold }}>
          {label}
        </span>
      )}
    </div>
  );
}