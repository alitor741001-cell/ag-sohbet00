export default function VipFeatureEditor({ features, levels, onChange }) {
  return <div className="space-y-2"><h3 className="text-sm font-bold">Ayrıcalıkların açılma seviyeleri</h3>
    {features.map((feature) => <label key={feature.key} className="flex items-center justify-between gap-3 text-xs"><span>{feature.label}{!feature.supported && ' (altyapı bağlı değil)'}</span>
      <select value={feature.minLevel} onChange={(event) => onChange(feature.key, Number(event.target.value))} className="rounded-lg bg-secondary p-2">{levels.map((level) => <option key={level.level} value={level.level}>VIP {level.level}</option>)}</select>
    </label>)}
  </div>;
}