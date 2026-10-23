import { Crown, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';

/** VIP vitrini: seviye çipleri, aura halkalı amblem kartı ve seviye künyesi. */
export default function VipLevelHero({ theme, levels, onLevel }) {
  return <section className="px-3 pt-3">
    <div role="tablist" aria-label="VIP seviyeleri" className="vip-scroll flex gap-2 overflow-x-auto pb-3">
      {levels.map((item) => {
        const active = theme.level === item.level;
        return <button type="button" role="tab" aria-selected={active} onClick={() => onLevel(item.level)} key={item.level}
          className={`vip-chip shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-black transition ${active ? 'vip-chip-on' : 'opacity-70'}`}>
          VIP {item.level}
        </button>;
      })}
    </div>

    <div className="vip-hero-card relative isolate overflow-hidden rounded-[28px] border">
      <span className="vip-hero-aura" aria-hidden="true" />
      <span className="vip-hero-ring" aria-hidden="true" />
      <Image key={theme.level} src={theme.image} alt={`VIP ${theme.level} ${theme.name} amblemi`} fittingType="fit" className="vip-hero-emblem relative z-10 mx-auto aspect-square w-[78%]" />
      <div className="relative z-10 -mt-6 px-5 pb-6 text-center">
        <p className="vip-gold flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-[.42em]">
          <Sparkles className="h-3 w-3" /> AG SOHBET · EFSANE KOLEKSİYON <Sparkles className="h-3 w-3" />
        </p>
        <h2 className="vip-hero-title mt-2 flex items-center justify-center gap-2 font-display text-4xl font-black">
          <Crown className="h-7 w-7" fill="currentColor" /> VIP {theme.level}
        </h2>
        <p className="vip-tint mt-1 text-sm font-bold tracking-wide">{theme.name}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-left">
          <div className="vip-glass rounded-2xl px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Süre</p>
            <p className="text-sm font-black">{theme.purchase_days || theme.days || 30} gün</p>
          </div>
          <div className="vip-glass rounded-2xl px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Fiyat</p>
            <p className="vip-gold text-sm font-black tabular-nums">{Number(theme.purchase_coins || 0).toLocaleString('tr-TR')}</p>
          </div>
        </div>
      </div>
    </div>
  </section>;
}