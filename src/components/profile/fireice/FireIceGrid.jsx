import { Bell, Briefcase, Building2, Crown, ShoppingBag, Store, TrendingUp, Users } from 'lucide-react';

const TILES = [
  { key: 'shop', label: 'Alışveriş Merkezi', icon: ShoppingBag, tone: '#ffd166' },
  { key: 'store', label: 'Mağaza', icon: Store, tone: '#2ee6ff' },
  { key: 'bag', label: 'VIP Çantası', icon: Briefcase, tone: '#ffb347' },
  { key: 'level', label: 'Seviye', icon: TrendingUp, tone: '#2ee6ff' },
  { key: 'vip', label: 'VIP', icon: Crown, tone: '#ffd166' },
  { key: 'agency', label: 'Ajans', icon: Building2, tone: '#ff9a3c' },
  { key: 'friends', label: 'Arkadaşlar', icon: Users, tone: '#2ee6ff' },
  { key: 'notifications', label: 'Bildirimler', icon: Bell, tone: '#ff9a3c' },
];

const TILE = 'fi-frame fi-tile flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 active:scale-[0.97]';

/** Profil ızgarası: iki sütun, dört satır — her kutu ateş-buz çerçeveli. */
export default function FireIceGrid({ vipCount = 0, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {TILES.map((tile) => (
        <button key={tile.key} type="button" onClick={() => onSelect(tile.key)} className={TILE}>
          <span className="relative">
            <tile.icon className="h-5 w-5" style={{ color: tile.tone }} />
            {tile.key === 'bag' && vipCount > 0 && (
              <span className="absolute -right-2.5 -top-1.5 rounded-full bg-[#e11d2e] px-1 py-[1px] text-[8px] font-black leading-tight text-white">{vipCount}</span>
            )}
          </span>
          <span className="text-center text-[10.5px] font-bold leading-tight text-white/90">{tile.label}</span>
        </button>
      ))}
    </div>
  );
}