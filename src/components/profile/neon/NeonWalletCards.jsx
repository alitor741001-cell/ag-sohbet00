import { ChevronRight } from 'lucide-react';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
import { MENU_ICONS } from '@/components/profile/fantasy/icons';
import NeonPanel from '@/components/profile/neon/NeonPanel';

const SOURCE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/07e59aa53_IMG_0094.jpg';
const COINS = { image_url: SOURCE, crop: { x: .065, y: .22, w: .095, h: .50 }, remove_white: true };
const DIAMONDS = { image_url: SOURCE, crop: { x: .535, y: .28, w: .095, h: .48 }, remove_white: true };

const money = (value) => (value == null ? '—' : Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 }));

function Tile({ art, label, value, sub, onClick, crest }) {
  return (
    <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-2 px-3 py-3 text-left active:scale-[0.98]">
      {crest ? (
        <img src={MENU_ICONS.vip} alt="" className="h-10 w-10 shrink-0 object-contain" style={{ mixBlendMode: 'screen' }} />
      ) : (
        <CosmeticArtwork product={art} blend={false} className="h-9 w-9 shrink-0 drop-shadow-[0_0_8px_rgba(255,190,60,0.65)]" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-bold text-[#9fd8ff]">{label}</span>
        <span className="block truncate text-[17px] font-black leading-tight tabular-nums text-white">{value}</span>
        {sub && <span className="block truncate text-[11px] font-semibold tabular-nums text-white/55">{sub}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/45" aria-hidden="true" />
    </button>
  );
}

/** Cüzdan kartları: coins, elmas, VIP ve hediye geçmişi. */
export default function NeonWalletCards({ coins, score, diamonds, diamondScore, vipCount, onCoins, onDiamonds, onVip, onHistory }) {
  const DIVIDER = 'border-white/10';
  return (
    <NeonPanel innerClassName="overflow-hidden">
      <div className={`grid grid-cols-2 divide-x ${DIVIDER.replace('border', 'divide')}`}>
        <Tile art={COINS} label="Coins" value={money(coins)} sub={score == null ? null : money(score)} onClick={onCoins} />
        <Tile art={DIAMONDS} label="Elmaslar" value={money(diamonds)} sub={diamondScore == null ? null : money(diamondScore)} onClick={onDiamonds} />
      </div>
      <div className={`grid grid-cols-2 divide-x border-t ${DIVIDER} ${DIVIDER.replace('border', 'divide')}`}>
        <Tile crest label="Vip" value={`${vipCount} VIP`} onClick={onVip} />
        <Tile art={{ image_url: MENU_ICONS.wallet }} label="Hediye Geçmişi" value="Geçmişi gör..." onClick={onHistory} />
      </div>
    </NeonPanel>
  );
}