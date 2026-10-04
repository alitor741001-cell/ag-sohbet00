import { useState } from 'react';
import GiftManager from '@/components/admin/gifts/GiftManager';
import GiftTierManager from '@/components/admin/gifts/GiftTierManager';
import GiftSendHistory from '@/components/admin/gifts/GiftSendHistory';

const TABS = [
  { key: 'gifts', label: 'Hediyeler' },
  { key: 'tiers', label: 'K Seviyeleri' },
  { key: 'history', label: 'Gönderim Geçmişi' },
];

/** Admin panel: hediyeler, K seviyesi renkleri ve hediye gönderim geçmişi. */
export default function AdminGifts() {
  const [tab, setTab] = useState('gifts');

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Hediyeler</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Hediye tahtasındaki hediyeler, K fiyatları, K renk seviyeleri ve kim kime ne gönderdi kayıtları.
      </p>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === item.key ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-foreground'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'gifts' && <GiftManager />}
      {tab === 'tiers' && <GiftTierManager />}
      {tab === 'history' && <GiftSendHistory />}
    </div>
  );
}