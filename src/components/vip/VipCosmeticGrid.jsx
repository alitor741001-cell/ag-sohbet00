import VipCosmeticPreview from '@/components/vip/VipCosmeticPreview';
export default function VipCosmeticGrid({ theme, features, onPreview, avatar, name }) {
  return <section className="vip-parchment relative mx-2 rounded-3xl px-3 py-5">
    <h2 className="vip-gold mb-4 text-center font-display text-lg font-extrabold">✧ Kimlik Rozeti ✧</h2>
    <div className="grid grid-cols-3 gap-2">
      {features.filter((feature) => feature.supported && feature.cosmetic !== false).map((feature) => <button type="button" key={feature.key} onClick={() => onPreview({ kind: feature.key, label: feature.label, theme })} className="vip-tile flex min-w-0 flex-col items-center rounded-xl p-1.5 active:scale-95">
        <VipCosmeticPreview kind={feature.key} theme={theme} avatar={avatar} name={name} />
        <span className="text-center text-[10px] font-bold">{feature.label}</span>
        <span className="vip-gold mt-1 text-[8px]">{theme.level < feature.minLevel ? `VIP ${feature.minLevel} ile açılır` : 'Ön İzle'}</span>
      </button>)}
    </div>
  </section>;
}