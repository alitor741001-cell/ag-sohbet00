import { useState } from 'react';
import { Bell, Flag } from 'lucide-react';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminUserReports from '@/pages/admin/AdminUserReports';

const TABS = [
  { key: 'bildirim', label: 'Bildirimler', icon: Bell },
  { key: 'sikayet', label: 'Şikayetler', icon: Flag },
];

/** Bildirimler ve şikayetler tek ekranda toplanır: üstteki sekmelerle geçilir. */
export default function AdminInbox() {
  const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get('tab') === 'sikayet' ? 'sikayet' : 'bildirim'));

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold ${tab === key ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-card text-muted-foreground'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      {tab === 'sikayet' ? <AdminUserReports /> : <AdminNotifications />}
    </div>
  );
}