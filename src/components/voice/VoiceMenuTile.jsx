import { neonCircleClass, NEON_TONES } from '@/lib/neonStyle';

/** Oda ayarları ızgarasındaki yuvarlak ikon düğmesi — ikon dairenin içinde, etiketi altında.
    Karanlık neon dil: siyah zemin, parlayan çerçeve; seçiliyken daire altın renkle dolar. */
export default function VoiceMenuTile({ icon: Icon, label, onClick, active, disabled, tone = 'gold' }) {
  const palette = NEON_TONES[tone] || NEON_TONES.gold;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={!!active}
      className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-40"
    >
      <span className={`h-14 w-14 ${neonCircleClass(tone)} ${active ? 'border-[#F2CE6B] bg-[#F2CE6B] text-black' : palette.text}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span className={`max-w-[72px] text-center text-[11px] font-semibold leading-tight ${active ? 'text-[#F2CE6B]' : palette.label}`}>{label}</span>
    </button>
  );
}