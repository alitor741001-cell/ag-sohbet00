import { useState } from 'react';
import RoomHistory from '@/components/home/RoomHistory';
import FollowedPanel from '@/components/home/FollowedPanel';

const TABS = [
  { key: 'friends', label: 'Arkadaşlar' },
  { key: 'following', label: 'Takip Ediliyor' },
  { key: 'visitors', label: 'Son Ziyaretçiler' },
];

/** Takip görünümü: arkadaşların/takip edilenlerin yayınları ve haftalık son ziyaret edilen odalar. */
export default function FollowPanel({ rooms, owners, friends, filmTitleFor, historyVersion, onHistoryChange }) {
  const [tab, setTab] = useState('following');

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`flex min-w-0 flex-1 items-center justify-center rounded-full border-2 bg-black/50 px-1 py-2 text-[11px] font-bold text-white transition active:scale-[0.98] ${
                active
                  ? 'border-[#ffa63d] shadow-[0_0_12px_rgba(255,140,40,0.9),inset_0_0_8px_rgba(255,140,40,0.5)]'
                  : 'border-[#3d8bff] shadow-[0_0_10px_rgba(60,140,255,0.8),inset_0_0_6px_rgba(60,140,255,0.4)]'
              }`}
            >
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'visitors' ? (
        <RoomHistory version={historyVersion} onChange={onHistoryChange} rooms={rooms} filmTitleFor={filmTitleFor} />
      ) : (
        <FollowedPanel mode={tab} rooms={rooms} owners={owners} friends={friends} filmTitleFor={filmTitleFor} />
      )}
    </div>
  );
}