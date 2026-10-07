import { useState } from 'react';
import { Bell, Headset } from 'lucide-react';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminSupport from '@/pages/admin/AdminSupport';

const TABS = [
  { key: 'bildirim', label: 'Bildirimler', icon: Bell },
  { key: 'destek', label: 'Destek Mesajları', icon: Headset },
];

/** Bildirimler ve destek mesajları tek ekranda toplanır: üstteki sekmelerle geçilir. */
export default function AdminInbox() {
  const [tab, setTab] = useState(() => {
    const wanted = new URLSearchParams(window.location.search).get('tab');
    return TABS.some((item) => item.key === wanted) ? wanted : 'bildirim';
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
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
      {tab === 'destek' ? <AdminSupport /> : <AdminNotifications />}
    </div>
  );
}