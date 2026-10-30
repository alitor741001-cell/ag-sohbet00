import { Gift } from 'lucide-react';
import DragonWalletTile from '@/components/profile/neon/DragonWalletTile';

const money = (value) => value == null ? '—' : Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 });

export default function NeonWalletCards({ coins, score, diamonds, diamondScore, vipCount, onCoins, onDiamonds, onVip, onHistory }) {
  return <div className="grid grid-cols-2 gap-2.5">
    <DragonWalletTile kind="coins" label="Coins" value={money(coins)} sub={score == null ? null : money(score)} onClick={onCoins} />
    <div className="relative">
      <DragonWalletTile kind="diamonds" label="Elmaslar" value={money(diamonds)} sub={diamondScore == null ? null : money(diamondScore)} onClick={onDiamonds} />
      <button type="button" onClick={onHistory} aria-label="Hediye geçmişi" className="dragon-gift-button absolute right-1.5 top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-full">
        <Gift className="h-4 w-4" />
      </button>
    </div>
  </div>;
}