import { Link } from 'react-router-dom';
import { Bell, UserPlus, Building2 } from 'lucide-react';

const ROWS = [
  { key: 'notes', label: 'Sistem Bildirimleri', hint: 'Sistemden gelen bildirimler', to: '/bildirimler', icon: Bell, color: 'bg-amber-500/20 text-amber-300' },
  { key: 'requests', label: 'Arkadaş İstekleri', hint: 'Gelen arkadaşlık istekleri', to: '/arkadaslar/istekler', icon: UserPlus, color: 'bg-sky-500/20 text-sky-300' },
  { key: 'agency', label: 'Ajans Mesajları', hint: 'Ajansından gelen mesajlar', to: '/ajans/mesajlar', icon: Building2, color: 'bg-fuchsia-500/20 text-fuchsia-300' },
];

/** Sistem/istek/ajans kutuları sohbet listesinde normal satır gibi görünür; dokununca tam sayfa açılır. */
export default function InboxRows({ counts = {}, onSelect }) {
  return ROWS.map(({ key, label, hint, to, icon: Icon, color }) => {
    const count = Number(counts[key] || 0);
    const body = (
      <>
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}><Icon className="h-6 w-6" /></span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-bold text-white">{label}</span>
          <span className="block truncate text-xs text-gray-400">{count > 0 ? `${count} yeni` : hint}</span>
        </span>
        {count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{count > 99 ? '99+' : count}</span>}
      </>
    );
    const cls = 'flex w-full items-center gap-3 border-b border-white/10 px-3 py-3 active:bg-white/10';
    return onSelect
      ? <button key={key} type="button" onClick={() => onSelect(key)} className={cls}>{body}</button>
      : <Link key={key} to={to} className={cls}>{body}</Link>;
  });
}