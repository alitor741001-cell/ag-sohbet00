import { Loader2 } from 'lucide-react';
import { compactTone } from '@/components/profile/compact/compactTheme';

const DANGER = {
  crystal: 'linear-gradient(158deg, #ffe9ee 0%, #ff9aa8 28%, #d63a53 60%, #ffd7de 84%, #ef7385 100%)',
  glow: '0 0 18px -6px rgba(214,58,83,0.9)',
  fill: 'linear-gradient(180deg, rgba(52,8,14,0.95), rgba(16,2,5,0.98))',
};

/**
 * Referanstaki dört kristal düğmeden biri: kare gövde, metalik kristal çerçeve,
 * içinde beyaz ikon ve altında kalın etiket.
 */
export default function CompactActionTile({
  icon: Icon, label, onClick, disabled = false, danger = false, active = false, loading = false, tone = 'pink', className = '',
}) {
  const c = compactTone(tone);
  const skin = danger ? DANGER : { crystal: c.crystal, glow: c.crystalGlow, fill: c.tileFill };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-pressed={active}
      className={`relative flex aspect-square w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[13px] transition active:scale-95 disabled:opacity-45 ${className}`}
      style={{ boxShadow: active ? `0 0 20px -4px ${c.mid}` : skin.glow }}
    >
      <span aria-hidden className="absolute inset-0 rounded-[13px]" style={{ background: skin.crystal }} />
      <span
        aria-hidden
        className="absolute inset-[2px] rounded-[11px]"
        style={{ background: skin.fill, border: '1px solid rgba(255,255,255,0.16)' }}
      />
      <span className="relative flex flex-col items-center gap-0.5 px-0.5">
        {loading
          ? <Loader2 className="h-[19px] w-[19px] animate-spin text-white" />
          : <Icon className="h-[19px] w-[19px] text-white drop-shadow" strokeWidth={1.9} />}
        <span className="max-w-full text-center text-[9px] font-black leading-[1.1] text-white">{label}</span>
      </span>
    </button>
  );
}