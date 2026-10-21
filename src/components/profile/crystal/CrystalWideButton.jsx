import { ChevronRight } from 'lucide-react';
import CrystalCorners from '@/components/profile/crystal/CrystalCorners';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

/** Referansteki geniş yatay bar: solda simge ve etiket, sağda ok. */
export default function CrystalWideButton({ icon: Icon, label, onClick, disabled = false, tone = 'blue' }) {
  const c = crystalSkin(tone);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex h-[34px] w-full items-center gap-2 rounded-[10px] border-[1.5px] px-3 active:scale-[0.99] disabled:opacity-40"
      style={{
        borderColor: c.blueEdge,
        background: c.glass,
        boxShadow: `inset 0 0 20px -10px ${c.glow}, 0 0 14px -9px ${c.blue}`,
      }}
    >
      <CrystalCorners />
      <Icon className="h-[14px] w-[14px] shrink-0" strokeWidth={2.2} style={{ color: c.gold }} />
      <span className="truncate text-[11px] font-black tracking-[0.02em] text-white">{label}</span>
      <ChevronRight className="ml-auto h-[15px] w-[15px] shrink-0" style={{ color: c.blue }} />
    </button>
  );
}