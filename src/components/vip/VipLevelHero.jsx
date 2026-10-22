import { Image } from '@/components/ui/image';
export default function VipLevelHero({ theme, levels, onLevel }) {
  return <section className="relative isolate overflow-hidden">
    <div role="tablist" aria-label="VIP seviyeleri" className="vip-scroll absolute inset-x-0 top-0 z-10 flex overflow-x-auto bg-gradient-to-b from-background/70 to-transparent px-3 py-3">
      {levels.map((item) => <button type="button" role="tab" aria-selected={theme.level === item.level} onClick={() => onLevel(item.level)} key={item.level} className="vip-tab shrink-0 px-4 py-3 text-lg font-black opacity-90">VIP {item.level}</button>)}
    </div>
    <Image key={theme.level} src={theme.image} alt={`VIP ${theme.level} ${theme.name} ejderha amblemi`} fittingType="fit" className="aspect-[4/5] w-full" />
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent px-5 pb-6 pt-12 text-center">
      <p className="vip-gold text-[10px] font-bold uppercase tracking-[.4em]">AG SOHBET · EJDERHA KOLEKSİYONU</p>
      <h2 className="mt-1 font-display text-3xl font-black">VIP {theme.level}</h2>
      <p className="vip-tint mt-1 text-sm font-semibold">{theme.name}</p>
    </div>
  </section>;
}