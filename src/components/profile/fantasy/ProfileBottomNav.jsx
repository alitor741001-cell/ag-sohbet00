import { Settings, ShieldCheck, UserPlus } from 'lucide-react';

const ITEMS = [
  { key: 'invite', label: 'Davet Et', Icon: UserPlus },
  { key: 'privacy', label: 'Gizlilik Politikası', Icon: ShieldCheck },
  { key: 'settings', label: 'Ayarlar', Icon: Settings },
];

/** Profil alt menüsü: davet, gizlilik ve ayarlar. */
export default function ProfileBottomNav({ onSelect }) {
  return (
    <div
      className="mx-4 mt-3 grid grid-cols-3 gap-1 rounded-2xl px-2 py-3"
      style={{ background: 'linear-gradient(180deg, rgba(8,26,54,0.95), rgba(3,10,24,0.95))', border: '1px solid rgba(125,211,252,0.28)' }}
    >
      {ITEMS.map(({ key, label, Icon }) => (
        <button key={key} type="button" onClick={() => onSelect(key)} className="flex flex-col items-center gap-1.5 active:scale-95">
          <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'rgba(15,45,88,0.85)', border: '1px solid rgba(125,211,252,0.35)' }}>
            <Icon className="h-4 w-4" style={{ color: '#a5e4ff' }} />
          </span>
          <span className="max-w-[88px] text-center text-[9.5px] font-semibold leading-tight" style={{ color: '#a5e4ff' }}>{label}</span>
        </button>
      ))}
    </div>
  );
}