import DragonWalletTile from '@/components/profile/neon/DragonWalletTile';

const money = (value) => value == null ? '—' : Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 });

export default function NeonWalletCards({ coins, score, diamonds, diamondScore, vipCount, onCoins, onDiamonds, onVip, onHistory }) {
  return <div className="grid grid-cols-2 gap-2.5">
    <DragonWalletTile kind="coins" label="Coins" value={money(coins)} sub={score == null ? null : money(score)} onClick={onCoins} />
    <DragonWalletTile kind="diamonds" label="Elmaslar" value={money(diamonds)} sub={diamondScore == null ? null : money(diamondScore)} onClick={onDiamonds} />
    <DragonWalletTile kind="vip" label="Vip" value={`${vipCount} VIP`} onClick={onVip} />
    <DragonWalletTile kind="history" label="Hediye Geçmişi" value="Geçmişi gör..." onClick={onHistory} />
  </div>;
}