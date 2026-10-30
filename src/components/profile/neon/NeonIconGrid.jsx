import { Image } from '@/components/ui/image';
import { MENU_ICONS } from '@/components/profile/fantasy/icons';
import NeonPanel from '@/components/profile/neon/NeonPanel';

const ITEMS = [
  { key: 'shop', label: 'Alışveriş Merkezi' },
  { key: 'bag', label: 'Çanta' },
  { key: 'level', label: 'Seviye' },
  { key: 'agency', label: 'Ajans' },
  { key: 'cp', label: 'CP' },
];

/** Profil ikon şeridi: mağaza, çanta, seviye, ajans ve CP. */
export default function NeonIconGrid({ vipCount = 0, onSelect }) {
  return (
    <NeonPanel innerClassName="px-1.5 py-3">
      <div className="grid grid-cols-5 gap-y-1">
        {ITEMS.map((item) => (
          <button key={item.key} type="button" onClick={() => onSelect(item.key)} className="flex min-w-0 flex-col items-center gap-1.5 active:scale-95">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#7dd3fc]/45 bg-[radial-gradient(circle_at_50%_35%,rgba(0,180,255,0.32),rgba(6,18,40,0.95)_72%)] shadow-[inset_0_0_16px_rgba(56,189,248,0.3)]">
              <Image src={MENU_ICONS[item.key]} alt="" fittingType="fit" className="h-8 w-8" style={{ mixBlendMode: 'screen' }} />
              {item.key === 'bag' && vipCount > 0 && (
                <span className="absolute -right-1 -top-1.5 rounded-full bg-[#e11d2e] px-1.5 py-[1px] text-[8px] font-black leading-tight text-white">Yeni</span>
              )}
            </span>
            <span className="max-w-[62px] text-center text-[9px] font-semibold leading-tight text-white/85">{item.label}</span>
          </button>
        ))}
      </div>
    </NeonPanel>
  );
}