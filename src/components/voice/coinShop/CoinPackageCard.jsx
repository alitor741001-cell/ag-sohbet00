import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { coinTier } from '@/components/voice/coinShop/coinShopAssets';
import { formatCoins } from '@/lib/giftTone';
import '@/styles/coinShop.css';

const formatTl = (value) => `${Math.max(0, Number(value) || 0).toLocaleString('tr-TR')} ₺`;

/** Tek coin paketi kartı: görsel kartı tam kaplar; miktar, adet seçimi ve Satın Al alt bölümde. */
export default function CoinPackageCard({ pack, qty = 1, onQty, onBuy }) {
  const total = (Number(pack.price) || 0) * qty;
  const tier = coinTier(pack.coins);
  return (
    <article className="cs-card">
      <div className="cs-card-art">
        <Image src={tier.url} alt={tier.label} fittingType="fill" className="h-full w-full" draggable={false} />
        <span className="cs-card-tier">{tier.label}</span>
        <div className="cs-card-amount">
          <p className="cs-card-coins">{formatCoins(pack.coins)}</p>
          <p className="cs-card-unit">Coins</p>
        </div>
      </div>

      <div className="cs-card-body">
        {/* Adet seçimi: aynı paketten birden fazla alınabilir (örn. 6 × 50.000 Coins). */}
        <div className="cs-qty">
          <button type="button" onClick={() => onQty?.(qty - 1)} disabled={qty <= 1} aria-label="Adet azalt" className="cs-step">
            <Minus className="h-3 w-3" strokeWidth={3} />
          </button>
          <span className="cs-qty-val">{qty} adet</span>
          <button type="button" onClick={() => onQty?.(qty + 1)} aria-label="Adet artır" className="cs-step">
            <Plus className="h-3 w-3" strokeWidth={3} />
          </button>
        </div>
        <p className="cs-price">{formatTl(total)}</p>
        {qty > 1 && (
          <p className="cs-multi">
            {formatCoins(pack.coins)} × {qty} = {formatCoins(pack.coins * qty)}
          </p>
        )}
        <button type="button" onClick={() => onBuy(pack)} className="cs-buy">
          <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2.6} /> Satın Al
        </button>
      </div>
    </article>
  );
}