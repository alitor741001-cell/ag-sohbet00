import React from 'react';
import { Coins, Ticket } from 'lucide-react';
import { format } from './rocketConfig';
import RocketRecent from './RocketRecent';

/** Alt şerit: tur numarası, FK Coin bakiyesi ve son kazançlar. */
export default function RocketStatsBar({ roundNo, coins, history }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5">
      <span className="rk-chip shrink-0 gap-1 text-[10px] font-black text-white">
        <Ticket className="h-3 w-3 text-[#ffb800]" />
        Tur {roundNo || 1}
      </span>
      <span className="rk-chip shrink-0 gap-1 text-[10px] font-black text-white">
        <Coins className="h-3 w-3 text-[#ffb800]" />
        {format(coins)}
      </span>
      <div className="min-w-0 flex-1">
        <RocketRecent history={history} />
      </div>
    </div>
  );
}