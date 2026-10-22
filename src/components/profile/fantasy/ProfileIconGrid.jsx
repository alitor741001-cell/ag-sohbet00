import { Image } from '@/components/ui/image';
import { ChevronRight, Gem } from 'lucide-react';
import { MENU_ICONS } from '@/components/profile/fantasy/icons';

const ITEMS = [
  { key: 'shop', label: 'Alışveriş Merkezi' },
  { key: 'bag', label: 'Çanta' },
  { key: 'level', label: 'Seviye' },
  { key: 'agency', label: 'Ajans' },
];

const ORB = {
  background: 'radial-gradient(circle at 50% 35%, rgba(56,189,248,0.35), rgba(8,26,54,0.95) 72%)',
  border: '1px solid rgba(125,211,252,0.45)',
  boxShadow: 'inset 0 0 18px rgba(56,189,248,0.3), 0 0 16px rgba(2,10,26,0.55)',
};

/** Profil ana menüsü: kristal ikonlu düğmeler. */
export default function ProfileIconGrid({ vipCount = 0, onSelect }) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: 'linear-gradient(180deg, rgba(9,30,64,0.75), rgba(4,14,32,0.75))',
        border: '1px solid rgba(190,165,110,0.45)',
        boxShadow: 'inset 0 0 30px rgba(56,189,248,0.12)',
      }}
    >
      <div className="grid grid-cols-4 gap-y-4">
        {ITEMS.map((item) => (
          <div key={item.key} className="flex min-w-0 flex-col items-center gap-2">
          <button type="button" onClick={() => onSelect(item.key)} className="flex flex-col items-center gap-1.5 active:scale-95">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full" style={ORB}>
              <Image src={MENU_ICONS[item.key]} alt="" fittingType="fit" className="h-10 w-10" style={{ mixBlendMode: 'screen' }} />
              {item.key === 'bag' && vipCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-[#e11d2e] px-1.5 py-[1px] text-[8px] font-black leading-tight text-white">Yeni</span>
              )}
            </span>
            <span className="max-w-[74px] text-center text-[10px] font-semibold leading-tight text-white/85">{item.label}</span>
          </button>
          {item.key === 'shop' && <button type="button" onClick={() => onSelect('store')} aria-label="Çerçeve koleksiyonunu aç" className="flex min-h-9 items-center justify-center gap-0.5 rounded-xl border border-cabinet-gold/40 bg-cabinet-surface/50 px-1.5 text-[9px] font-bold text-cabinet-gold active:scale-95"><Gem className="h-3 w-3 shrink-0" />Çerçeveler<ChevronRight className="h-3 w-3 shrink-0" /></button>}
          </div>
        ))}
      </div>
    </div>
  );
}