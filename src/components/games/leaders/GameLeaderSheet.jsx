import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Coins, Crown, X } from 'lucide-react';
import useBackDismiss from '@/hooks/useBackDismiss';
import compactCoins from '@/lib/compactCoins';
import LeaderAvatar from './LeaderAvatar';

const TABS = [
  { key: 'today', label: 'Günlük' },
  { key: 'week', label: 'Haftalık' },
  { key: 'total', label: 'Toplam' },
];
const MEDALS = ['text-[#ffd76a]', 'text-slate-200', 'text-amber-600'];

/** Yarım sayfa: günlük, haftalık ve toplam en çok kazanan 50 kişi ayrı sekmelerde. */
export default function GameLeaderSheet({ open, title, leaders, onClose }) {
  const [tab, setTab] = useState('today');
  useBackDismiss(open, onClose);
  useEffect(() => { if (open) setTab('today'); }, [open]);
  if (!open) return null;
  const rows = leaders?.[tab] || [];
  return createPortal(
    <div className="fixed inset-0 z-[380] flex flex-col justify-end">
      <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="animate-sheet-up relative flex max-h-[70%] flex-col rounded-t-[26px] border-t-2 border-[#f0c060] bg-gradient-to-b from-[#33104a] to-[#12041d] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-white">
        <div className="mb-3 flex items-center gap-2">
          <Crown className="h-5 w-5 text-[#ffd76a]" />
          <p className="flex-1 truncate text-base font-black tracking-wide text-[#ffe9a8]">{title} Kazananları</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-1 rounded-full bg-black/40 p-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-full py-1.5 text-xs font-black ${tab === item.key ? 'bg-gradient-to-b from-[#ffeaa6] to-[#c99020] text-[#2b1602]' : 'text-white/70'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <ol className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
          {rows.length === 0 && <li className="py-8 text-center text-sm font-bold text-white/60">Henüz kazanan yok</li>}
          {rows.map((leader, index) => (
            <li key={leader.user_id} className="flex items-center gap-2.5 rounded-2xl bg-white/[0.06] px-2.5 py-2">
              <span className={`w-6 shrink-0 text-center text-sm font-black ${MEDALS[index] || 'text-white/60'}`}>{index + 1}</span>
              <LeaderAvatar leader={leader} className="h-10 w-10 shrink-0 text-lg" />
              <p className="min-w-0 flex-1 truncate text-sm font-black">{leader.name}</p>
              <span className="flex shrink-0 items-center gap-1 font-mono text-sm font-black text-[#ffe9a8]">
                <Coins className="h-4 w-4 text-[#ffd76a]" /> {compactCoins(leader.won)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>,
    document.body,
  );
}