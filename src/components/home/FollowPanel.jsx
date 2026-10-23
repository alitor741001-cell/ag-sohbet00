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
              className={`flex min-w-0 flex-1 items-center justify-center rounded-xl px-1 py-2 text-[10px] font-extrabold transition active:scale-[0.98] ${
                active
                  ? 'border border-[#e8c47c]/70 bg-[#2c2c3e] text-[#ffe6a8] shadow-[0_0_18px_-6px_rgba(232,196,124,0.9)]'
                  : 'border border-white/10 bg-[#3d4c63]/70 text-white/60'
              }`}
            >
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'visitors' ? (
        <RoomHistory version={historyVersion} onChange={onHistoryChange} rooms={rooms} />
      ) : (
        <FollowedPanel mode={tab} rooms={rooms} owners={owners} friends={friends} filmTitleFor={filmTitleFor} />
      )}
    </div>
  );
}