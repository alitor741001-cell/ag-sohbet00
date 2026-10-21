import { Check, X } from 'lucide-react';
import { VIP_COSMETIC_LABELS } from '@/hooks/useVipCosmetics';
import { Image } from '@/components/ui/image';

const ICONS = {
  badge: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/2014bedbf_generated_image.png',
};

/** Çantadaki VIP ürünleri: kullanmak istmediğin ürünü kaldır, istediğini etkinleştir. */
export default function VipCosmeticsBag({ items = [], level = 0, busy, onToggle }) {
  if (level < 5) {
    return (
      <div className="mt-4 rounded-2xl border border-[#c5a574]/30 bg-black/30 p-3">
        <p className="text-[11px] font-bold tracking-[0.1em] text-[#c5a574]">KİMLİK ROZETİ ÜRÜNLERİ</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/55">
          VIP5 olduğunda rozet, çerçeve, mikrofon dalgası, sohbet balonu, VIP aracı ve oda koltuğu otomatik olarak buraya düşer.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#c5a574]/35 bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-black tracking-[0.1em] text-[#c5a574]">KİMLİK ROZETİ ÜRÜNLERİ</p>
        <span className="rounded-full bg-[#f4d03f]/15 px-2 py-0.5 text-[10px] font-black text-[#f4d03f]">VIP{level}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.kind} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c5a574]/50 bg-[#1a0b02]">
              {ICONS[item.kind] ? (
                <Image src={ICONS[item.kind]} alt="" fittingType="fill" className="h-5 w-5" />
              ) : (
                <span className="text-[10px] font-black text-[#f4d03f]">V</span>
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-white">{VIP_COSMETIC_LABELS[item.kind] || item.kind}</span>
            <button
              type="button"
              disabled={busy === item.kind}
              onClick={() => onToggle(item.kind, !item.active)}
              className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10.5px] font-black active:scale-95 disabled:opacity-50 ${
                item.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#f4d03f] text-[#2a1503]'
              }`}
            >
              {item.active ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              {item.active ? 'Kaldır' : 'Etkinleştir'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}