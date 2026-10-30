import { Settings, ShieldCheck, UserMinus } from 'lucide-react';
import NeonPanel from '@/components/profile/neon/NeonPanel';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
import { DRAGON_ICONS } from '@/components/profile/neon/dragonArt';

const ITEMS = [
  { key: 'blocked', label: 'Engellenen Hesaplar', icon: UserMinus, color: '#ff6b6b' },
  { key: 'privacy', label: 'Gizlilik Politikası', icon: ShieldCheck, color: '#38bdf8' },
  { key: 'settings', label: 'Ayarlar', icon: Settings, color: '#38bdf8' },
];

/** Profil alt menüsü. */
export default function NeonFooterMenu({ onSelect }) {
  return (
    <NeonPanel className="dragon-footer" innerClassName="grid grid-cols-3">
      {ITEMS.map((item, index) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className="flex min-w-0 flex-col items-center gap-1.5 px-1 py-3 active:scale-95"
          style={index > 0 ? { borderLeft: '1px solid rgba(125,211,252,0.14)' } : undefined}
        >
          <CosmeticArtwork product={DRAGON_ICONS[item.key]} blend={false} className="h-12 w-12" />
          <span className="text-center text-[9.5px] font-semibold leading-tight text-white/85">{item.label}</span>
        </button>
      ))}
    </NeonPanel>
  );
}