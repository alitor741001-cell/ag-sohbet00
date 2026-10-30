import { Coins, Gem, Eye } from 'lucide-react';

export default function ReferenceWallet({ coins, diamonds, liveRoom, viewers, onCoins, onDiamonds, onJoin }) {
  const format = value => value == null ? '—' : Number(value).toLocaleString('tr-TR');
  return <section className="reference-wallet" aria-label="Cüzdan ve yayın durumu">
    <div className="reference-balances">
      <button type="button" onClick={onCoins}><Coins /><span>Coins</span><strong>{format(coins)}</strong></button>
      <button type="button" onClick={onDiamonds}><Gem /><span>Elmaslar</span><strong>{format(diamonds)}</strong></button>
    </div>
    <div className="reference-live">
      <span>{liveRoom ? 'Yayında' : 'Yayında değil'}</span>
      {liveRoom && <><span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{viewers}</span><button type="button" onClick={onJoin}>Yayına Katıl</button></>}
    </div>
  </section>;
}