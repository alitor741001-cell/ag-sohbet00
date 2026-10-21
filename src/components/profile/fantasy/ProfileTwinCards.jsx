import { Image } from '@/components/ui/image';
import { formatCoins } from '@/lib/giftTone';
import { MENU_ICONS } from '@/components/profile/fantasy/icons';

const CARD = {
  background: 'linear-gradient(135deg, rgba(14,48,96,0.95), rgba(5,18,40,0.95))',
  border: '1px solid rgba(125,211,252,0.35)',
  boxShadow: 'inset 0 0 26px rgba(56,189,248,0.18), 0 0 18px rgba(2,10,26,0.6)',
};

const GOLD_TEXT = { color: '#f0c469', textShadow: '0 0 14px rgba(240,196,105,0.55)' };

/** Profil menüsündeki iki geniş kart: VIP çantası ve cüzdan. */
export default function ProfileTwinCards({ vipCount = 0, coins, onVip, onWallet }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <button type="button" onClick={onVip} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left active:scale-[0.98]" style={CARD}>
        <span className="flex min-w-0 flex-col">
          <span className="font-serif text-xl leading-none" style={GOLD_TEXT}>Vip</span>
          <span className="mt-1 text-[10px] font-semibold text-white/70">{vipCount > 0 ? `${vipCount} VIP` : 'Çanta boş'}</span>
        </span>
        <Image src={MENU_ICONS.vip} alt="" fittingType="fit" className="h-12 w-12 shrink-0" style={{ mixBlendMode: 'screen' }} />
      </button>

      <button type="button" onClick={onWallet} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left active:scale-[0.98]" style={CARD}>
        <span className="flex min-w-0 flex-col">
          <span className="font-serif text-xl leading-none lowercase" style={GOLD_TEXT}>wallet</span>
          <span className="mt-1 truncate text-[10px] font-semibold tabular-nums text-white/70">
            {coins === null || coins === undefined ? '— coin' : `${formatCoins(coins)} coin`}
          </span>
        </span>
        <Image src={MENU_ICONS.wallet} alt="" fittingType="fit" className="h-12 w-12 shrink-0" style={{ mixBlendMode: 'screen' }} />
      </button>
    </div>
  );
}