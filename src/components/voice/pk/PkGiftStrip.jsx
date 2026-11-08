import { ChevronRight, Target } from 'lucide-react';
import formatCoinAmount from '@/components/voice/formatCoinAmount';

/**
 * PK ekranındaki hediye şeridi: hediyeler yatay kayar, seçilen tarafa gönderilir.
 * Gönderilen hediye o tarafın puanını yükseltir.
 */
export default function PkGiftStrip({ gifts = [], target = 'opponent', opponentName = 'Rakip', coins, onTargetChange, onSend }) {
  const list = gifts.slice(0, 12);
  return (
    <div className="shrink-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/80">
          <Target className="h-3 w-3" /> Hediye
        </span>
        <button
          type="button"
          onClick={() => onTargetChange?.('me')}
          className={`rounded-full px-2.5 py-1 text-[10px] font-black active:scale-95 ${target === 'me' ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.9)]' : 'bg-white/10 text-white/70'}`}
        >
          Bana
        </button>
        <button
          type="button"
          onClick={() => onTargetChange?.('opponent')}
          className={`max-w-[45%] truncate rounded-full px-2.5 py-1 text-[10px] font-black active:scale-95 ${target === 'opponent' ? 'bg-fuchsia-500 text-white shadow-[0_0_12px_rgba(217,70,239,0.9)]' : 'bg-white/10 text-white/70'}`}
        >
          {opponentName}
        </button>
        {typeof coins === 'number' && (
          <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black tabular-nums text-amber-200">
            {formatCoinAmount(coins)}
          </span>
        )}
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
        {list.map((gift) => (
          <button
            key={gift.id}
            type="button"
            onClick={() => onSend?.(gift)}
            aria-label={`${gift.name} hediyesini gönder`}
            className="flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-xl border border-white/15 bg-white/[0.06] px-1 py-1.5 active:scale-95"
          >
            {gift.image_url ? (
              <img src={gift.image_url} alt="" className="h-7 w-7 object-contain" />
            ) : (
              <span className="text-xl leading-none">{gift.emoji || '🎁'}</span>
            )}
            <span className="w-full truncate text-center text-[8.5px] font-bold leading-tight text-white/85">{gift.name}</span>
            <span className="text-[9px] font-black tabular-nums text-amber-300">{formatCoinAmount(gift.k_value)}K</span>
          </button>
        ))}
        <span className="flex w-8 shrink-0 items-center justify-center text-white/40">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}