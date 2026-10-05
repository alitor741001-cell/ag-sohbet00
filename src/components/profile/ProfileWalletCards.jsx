import { Briefcase, ChevronRight, Coins, Crown, Gem } from 'lucide-react';
import { formatCoins } from '@/lib/giftTone';
import { formatScore } from '@/components/voice/scoreTier';

/**
 * Profil cüzdanı: solda yüklenen coinler (mavi neon), sağda hediyelerden biriken
 * elmas (altın neon). Altında mavi çanta (VIP) ve ajans işlemleri satırları durur.
 */
const COIN_TONE = {
  background: 'linear-gradient(150deg, rgba(0,176,255,0.2), rgba(6,10,20,0.9))',
  border: '1px solid rgba(0,176,255,0.55)',
  boxShadow: '0 0 18px rgba(0,176,255,0.22)',
};

const GOLD_TONE = {
  background: 'linear-gradient(150deg, rgba(255,171,0,0.2), rgba(24,14,2,0.9))',
  border: '1px solid rgba(255,171,0,0.55)',
  boxShadow: '0 0 18px rgba(255,171,0,0.22)',
};

export default function ProfileWalletCards({ coins, giftScore, vipCount = 0, onOpenGiftBox, onOpenCoins, onOpenVipBag, onOpenAgency }) {
  const coinText = coins === null || coins === undefined ? '—' : formatCoins(coins);
  const giftText = giftScore === null || giftScore === undefined ? '—' : formatScore(giftScore);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenCoins}
          className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-transform active:scale-95"
          style={COIN_TONE}
        >
          <Coins className="h-7 w-7 shrink-0 text-sky-300" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-white/70">Coins</span>
            <span className="block truncate text-base font-extrabold tabular-nums text-white">{coinText}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
        </button>

        <button
          type="button"
          onClick={onOpenGiftBox}
          className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-transform active:scale-95"
          style={GOLD_TONE}
        >
          <Gem className="h-7 w-7 shrink-0 text-[#7dd3fc]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-white/70">Elmaslar</span>
            <span className="block truncate text-base font-extrabold tabular-nums text-white">{giftText}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
        </button>
      </div>

      {/* İkinci sıra: elmasların altında mavi çanta, yanında eşit genişlikte ajans işlemleri.
          Mavi çanta: coin yüklemesinden gelen VIP'ler burada birikir.
          Ajans işlemleri: kendi tam sayfasına gider. (Yöneticilerde gizli.) */}
      <div className={`grid gap-2 ${onOpenAgency ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button
          type="button"
          onClick={onOpenVipBag}
          className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-transform active:scale-95"
          style={COIN_TONE}
        >
          <Briefcase className="h-6 w-6 shrink-0 text-sky-300" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-white/70">Mavi Çanta</span>
            <span className="block truncate text-base font-extrabold text-white">{vipCount > 0 ? `${vipCount} VIP` : 'Boş'}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
        </button>

        {onOpenAgency && (
          <button
            type="button"
            onClick={onOpenAgency}
            className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-transform active:scale-95"
            style={GOLD_TONE}
          >
            <Crown className="h-6 w-6 shrink-0 text-[#F5C542]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold text-white/70">Ajans İşlemleri</span>
              <span className="block truncate text-base font-extrabold text-white">Panel</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
          </button>
        )}
      </div>
    </div>
  );
}