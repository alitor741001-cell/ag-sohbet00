import React from 'react';
import { Users } from 'lucide-react';
import AviatorPlayerRow from './AviatorPlayerRow';

/** Sol panel: Katılanlar (çekenler) / Bekleyenler (aktif bahisler) ve toplam oyuncu. */
export default function AviatorPlayers({ bets }) {
  const all = bets || [];
  const cashed = all.filter((b) => b.status === 'cashed').sort((a, b) => b.cashout_at - a.cashout_at);
  const waiting = all.filter((b) => b.status === 'active');
  const list = [...cashed, ...waiting];
  const total = new Set(all.map((b) => b.user_id)).size;

  return (
    <aside className="absolute bottom-2 left-2 top-9 z-20 flex w-[26%] max-w-[9rem] flex-col rounded-xl border border-red-500/40 bg-black/55 backdrop-blur-sm">
      <div className="m-1.5 flex rounded-full bg-black/60 p-0.5 text-[10px] font-bold">
        <span className="av-tab-red flex-1 rounded-full py-1 text-center">Katılanlar</span>
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-1.5">
        {list.length === 0 && <p className="py-3 text-center text-[10px] text-white/40">Henüz oyuncu yok</p>}
        {list.map((b, i) => <AviatorPlayerRow key={b.id || i} bet={b} />)}
      </div>
      <div className="flex items-center gap-2 border-t border-white/10 px-2 py-1.5">
        <Users className="h-5 w-5 text-red-500" />
        <div className="leading-tight">
          <p className="text-[9px] text-white/60">Toplam Oyuncu</p>
          <p className="text-sm font-black text-red-500">{total}</p>
        </div>
      </div>
    </aside>
  );
}