import { Coins, Crown, Eye, Gem, Signal } from 'lucide-react';
import FireFrame from '@/components/profile/fireice/FireFrame';

const CELL = 'flex flex-col items-center gap-0.5 rounded-xl border border-white/10 bg-black/35 px-2 py-2 active:scale-[0.98]';

/** Cüzdan paneli: coins, elmaslar ve yayın durumu tek çerçevede. */
export default function FireIceWalletPanel({ coins, diamonds, vipLevel = 0, liveRoom, viewers = 0, onCoins, onDiamonds, onJoin }) {
  const live = !!liveRoom;
  const format = (value) => (value == null ? '—' : Number(value).toLocaleString('tr-TR'));

  return (
    <FireFrame innerClassName="p-2.5">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCoins} className={CELL}>
          <Coins className="h-4 w-4 text-[#ffd166]" />
          <span className="text-[10px] font-bold text-white/60">Coins</span>
          <span className="text-[15px] font-black tabular-nums text-[#ffe9a8]">{format(coins)}</span>
        </button>
        <button type="button" onClick={onDiamonds} className={CELL}>
          <Gem className="h-4 w-4 text-[#2ee6ff]" />
          <span className="text-[10px] font-bold text-white/60">Elmaslar</span>
          <span className="text-[15px] font-black tabular-nums text-[#d6f7ff]">{format(diamonds)}</span>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-2.5 py-1.5">
        <span className="flex items-center gap-1.5 text-[10.5px] font-black text-white/85">
          <Signal className={`h-3 w-3 ${live ? 'text-[#ffd166]' : 'text-white/45'}`} />
          {live ? 'Yayında' : 'Çevrim dışı'}
          {live && (
            <span className="flex items-center gap-1 text-white">
              <Eye className="h-3 w-3" /> {viewers.toLocaleString('tr-TR')}
            </span>
          )}
        </span>
        {live ? (
          <button
            type="button"
            onClick={onJoin}
            className="rounded-full px-3 py-1 text-[10.5px] font-black text-[#1b1204] active:scale-95"
            style={{ background: 'linear-gradient(135deg, #ffe9a8, #ffb347 55%, #ff7a18)', boxShadow: '0 0 12px rgba(255,150,40,0.7)' }}
          >
            Yayına Katıl
          </button>
        ) : (
          <span className="flex items-center gap-1 rounded-full border border-[#ffd166]/50 bg-[#3a2205]/60 px-2.5 py-1 text-[10.5px] font-black text-[#ffe9a8]">
            <Crown className="h-3 w-3" fill="currentColor" /> VIP{vipLevel}
          </span>
        )}
      </div>
    </FireFrame>
  );
}