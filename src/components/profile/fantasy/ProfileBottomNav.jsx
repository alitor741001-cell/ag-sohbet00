import { Ban, Settings, ShieldCheck, UserPlus } from 'lucide-react';

const ITEMS = [
  { key: 'invite', label: 'Davet Et', Icon: UserPlus },
  { key: 'blocked', label: 'Engellenen Hesaplar', Icon: Ban },
  { key: 'privacy', label: 'Gizlilik Politikası', Icon: ShieldCheck },
  { key: 'settings', label: 'Ayarlar', Icon: Settings },
];

/** Profil alt menüsü: davet, engellenenler, gizlilik ve ayarlar. */
export default function ProfileBottomNav({ onSelect }) {
  return (
    <div
      className="mx-4 mt-3 grid grid-cols-4 gap-1 rounded-2xl px-2 py-3"
      style={{ background: 'linear-gradient(180deg, rgba(8,26,54,0.95), rgba(3,10,24,0.95))', border: '1px solid rgba(190,165,110,0.28)' }}
    >
      {ITEMS.map(({ key, label, Icon }) => (
        <button key={key} type="button" onClick={() => onSelect(key)} className="flex flex-col items-center gap-1.5 active:scale-95">
          <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'rgba(15,45,88,0.8)', border: '1px solid rgba(240,196,105,0.3)' }}>
            <Icon className="h-4 w-4" style={{ color: '#f0d79b' }} />
          </span>
          <span className="max-w-[76px] text-center text-[9.5px] font-semibold leading-tight" style={{ color: '#f0d79b' }}>{label}</span>
        </button>
      ))}
    </div>
  );
}