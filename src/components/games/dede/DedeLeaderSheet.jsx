import React from 'react';
import { Coins, Crown, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import useBackDismiss from '@/hooks/useBackDismiss';
import { formatCoins } from './dedeConfig';

const ROWS = [
  { key: 'today', label: 'Bugünün Kazananı' },
  { key: 'week', label: 'Haftanın Kazananı' },
  { key: 'total', label: 'Toplam Kazanan' },
];

function LeaderRow({ label, leader }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-[#f0c060]/40 bg-gradient-to-r from-[#4c1a66] to-[#1d0830] p-3">
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-[#ffd76a]">
        {leader?.avatar ? (
          <Image src={leader.avatar} alt={leader.name} className="h-full w-full" fittingType="fill" quality={70} />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[#3a0f52] text-lg font-black text-[#ffd76a]">
            {(leader?.name || '?').trim().charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#ffd76a]">{label}</p>
        <p className="truncate text-sm font-black text-white">{leader ? leader.name : 'Henüz kazanan yok'}</p>
      </div>
      {leader && (
        <span className="flex shrink-0 items-center gap-1 font-mono text-sm font-black text-[#ffe9a8]">
          <Coins className="h-4 w-4 text-[#ffd76a]" /> {formatCoins(leader.won)}
        </span>
      )}
    </li>
  );
}

/** Yarım sayfa: bugün, bu hafta ve toplamda en çok kazananlar. */
export default function DedeLeaderSheet({ open, leaders, onClose }) {
  useBackDismiss(open, onClose);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[60] flex flex-col justify-end">
      <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="animate-sheet-up relative max-h-[60%] overflow-y-auto rounded-t-[26px] border-t-2 border-[#f0c060] bg-gradient-to-b from-[#33104a] to-[#12041d] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-3 flex items-center gap-2">
          <Crown className="h-5 w-5 text-[#ffd76a]" />
          <p className="flex-1 text-base font-black tracking-wide text-[#ffe9a8]">Dede Kazananları</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="space-y-2.5">
          {ROWS.map((row) => <LeaderRow key={row.key} label={row.label} leader={leaders?.[row.key]} />)}
        </ul>
      </div>
    </div>
  );
}