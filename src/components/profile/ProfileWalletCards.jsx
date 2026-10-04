import { Briefcase, ChevronRight, Coins, Gem } from 'lucide-react';
import { formatCoins } from '@/lib/giftTone';
import { formatScore } from '@/components/voice/scoreTier';

/**
 * Profil menüsündeki cüzdan kartları: solda yüklenen coinler,
 * sağda hediyelerden biriken elmas (hediye kutusu) değeri.
 * Elmasın altında mavi çanta durur: coin yüklemesinden gelen VIP'ler orada birikir.
 */
export default function ProfileWalletCards({ coins, giftScore, vipCount = 0, onOpenGiftBox, onOpenCoins, onOpenVipBag }) {
  const coinText = coins === null || coins === undefined ? '—' : formatCoins(coins);
  const giftText = giftScore === null || giftScore === undefined ? '—' : formatScore(giftScore);

  return (
    <div className="border-b border-white/10 px-3 py-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenCoins}
          className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-sm transition-transform active:scale-95"
        >
          <Coins className="h-6 w-6 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-bold tabular-nums text-[#1F2024]">{coinText}</p>
            <p className="text-[10px] font-semibold text-[#6b7280]">Coins</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenGiftBox}
          className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-sm transition-transform active:scale-95"
        >
          <Gem className="h-6 w-6 shrink-0 text-sky-400" />
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-bold tabular-nums text-[#1F2024]">{giftText}</p>
            <p className="text-[10px] font-semibold text-[#6b7280]">Elmaslar</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#c4c9d0]" />
        </button>
      </div>

      {/* Mavi çanta: coin yüklemesinden gelen VIP'ler burada birikir. */}
      <button
        type="button"
        onClick={onOpenVipBag}
        className="mt-2 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 transition-transform active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.92), rgba(59,130,246,0.72))',
          border: '1px solid rgba(147,197,253,0.45)',
          boxShadow: '0 0 14px rgba(59,130,246,0.25)',
        }}
      >
        <Briefcase className="h-6 w-6 shrink-0 text-sky-100" />
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-bold tabular-nums text-white">{vipCount > 0 ? `${vipCount} VIP` : 'Boş'}</p>
          <p className="text-[10px] font-semibold text-sky-100/85">Mavi Çanta</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-sky-100/70" />
      </button>
    </div>
  );
}