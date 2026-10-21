import { Loader2 } from 'lucide-react';

/**
 * Kompakt profil kartının alt şeridindeki buz kristali düğme: katmanlı çerçeve,
 * mavi ışıma ve ikon + etiket. `tone="rose"` hediye düğmesini altın-pembe yapar.
 */
const FRAMES = {
  ice: {
    frame: 'linear-gradient(158deg, #f2fbff 0%, #a8d8f5 26%, #3576b8 58%, #d9f2ff 82%, #6aa9e0 100%)',
    glow: '0 0 18px -4px rgba(96, 176, 240, 0.85), inset 0 0 10px -4px rgba(190, 235, 255, 0.9)',
    fill: 'linear-gradient(180deg, rgba(11, 31, 51, 0.96), rgba(4, 12, 22, 0.99))',
    icon: '#d9f2ff',
  },
  rose: {
    frame: 'linear-gradient(158deg, #fff1f7 0%, #f6b6d2 26%, #d4af37 60%, #ffd9e9 84%, #e79ab9 100%)',
    glow: '0 0 20px -4px rgba(244, 143, 177, 0.9), inset 0 0 10px -4px rgba(255, 226, 196, 0.9)',
    fill: 'linear-gradient(180deg, rgba(58, 17, 37, 0.96), rgba(24, 7, 16, 0.99))',
    icon: '#ffd9e9',
  },
};

export default function CompactActionTile({
  icon: Icon, label, onClick, disabled = false, danger = false, active = false, loading = false, tone = 'ice', palette,
}) {
  const skin = danger ? FRAMES.rose : (FRAMES[tone] || FRAMES.ice);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-pressed={active}
      className="relative flex aspect-square max-h-[86px] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[18px] transition active:scale-95 disabled:opacity-45"
      style={{ boxShadow: active ? `0 0 22px -4px ${palette.glow}` : undefined }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-[18px]"
        style={{ background: skin.frame, boxShadow: active ? `0 0 22px -3px ${palette.accent}` : skin.glow }}
      />
      <span aria-hidden className="absolute inset-[2.5px] rounded-[16px]" style={{ background: skin.fill }} />
      <span
        aria-hidden
        className="absolute inset-x-2.5 top-[3px] h-[1px] opacity-70"
        style={{ background: 'linear-gradient(90deg, transparent, #eaf9ff, transparent)' }}
      />
      <span className="relative flex flex-col items-center gap-1 px-1">
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: skin.icon }} />
        ) : (
          <Icon className="h-6 w-6" strokeWidth={1.9} style={{ color: danger ? '#ffc9dd' : skin.icon }} />
        )}
        <span className="max-w-full text-center text-[9.5px] font-black leading-[1.15] text-white">{label}</span>
      </span>
    </button>
  );
}