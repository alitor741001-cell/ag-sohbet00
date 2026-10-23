import { Check, Heart, Lock, Star } from 'lucide-react';

/** Seviye sembolleri: her katman bir kart; ulaşılanlar parlar, sıradakiler kilitli. */
export default function LevelTierLadder({ tiers, level, wealth }) {
  const Icon = wealth ? Star : Heart;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {tiers.map((item) => {
        const reached = level >= item.value;
        return (
          <div key={item.range} className="relative overflow-hidden rounded-2xl border p-3"
            style={{
              borderColor: reached ? item.tone : 'rgba(255,255,255,0.1)',
              background: reached ? `linear-gradient(145deg, ${item.tone}40, rgba(20,10,38,.9))` : 'rgba(255,255,255,0.03)',
              boxShadow: reached ? `0 0 20px -8px ${item.tone}` : 'none',
            }}>
            <span className="absolute right-2 top-2 text-white/60">
              {reached ? <Check className="h-3.5 w-3.5" style={{ color: item.tone }} /> : <Lock className="h-3 w-3" />}
            </span>
            <span className="flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black"
              style={{ background: item.tone, color: item.text, opacity: reached ? 1 : 0.55 }}>
              <Icon className="h-3 w-3" fill="currentColor" /> {item.value}
            </span>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/50">Seviye</p>
            <p className="text-base font-black tabular-nums text-white">{item.range}</p>
          </div>
        );
      })}
    </div>
  );
}