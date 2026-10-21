import { ChevronRight, LogOut, Puzzle, Shield, User } from 'lucide-react';

const BASE_ROWS = [
  { key: 'info', label: 'Kişisel Bilgiler', hint: 'Kullanıcı adı, kimlik no ve hesap bilgileri', icon: User, color: '#7dd3fc' },
  { key: 'settings', label: 'Eklentiler', hint: 'Ek özellikleri buradan yönetebilirsin', icon: Puzzle, color: '#f2ce6b' },
  { key: 'logout', label: 'Çıkış Yap', hint: 'Hesabından güvenli çıkış yap', icon: LogOut, color: '#ff7b7b' },
];

const ADMIN_ROW = {
  key: 'admin',
  label: 'Yönetim Paneli',
  hint: 'Admin kontrol paneli',
  icon: Shield,
  color: '#e9d5ff',
  boxBg: 'rgba(76,29,149,0.55)',
  boxBorder: 'rgba(192,132,252,0.55)',
};

/** Profil alt menüsü: hesap işlemleri tek kristal kartta toplanır. */
export default function ProfileMenuCard({ isAdmin, onInfo, onSettings, onLogout, onAdmin }) {
  const handlers = { info: onInfo, settings: onSettings, logout: onLogout, admin: onAdmin };
  // Yönetim Paneli listenin başında durur: kişisel bilgilerin üstünde görünür.
  const rows = isAdmin ? [ADMIN_ROW, ...BASE_ROWS] : BASE_ROWS;

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(180deg, rgba(9,30,64,0.9), rgba(4,14,32,0.92))',
        border: '1px solid rgba(125,211,252,0.32)',
        boxShadow: 'inset 0 0 26px rgba(56,189,248,0.14)',
      }}
    >
      {rows.map((row, index) => (
        <button
          key={row.key}
          type="button"
          onClick={handlers[row.key]}
          className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/5 ${index > 0 ? 'border-t border-white/8' : ''}`}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: row.boxBg || 'rgba(15,45,88,0.85)',
              border: `1px solid ${row.boxBorder || `${row.color}55`}`,
            }}
          >
            <row.icon className="h-4 w-4" style={{ color: row.color }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-white">{row.label}</span>
            <span className="block truncate text-[10.5px] text-white/45">{row.hint}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />
        </button>
      ))}
    </div>
  );
}