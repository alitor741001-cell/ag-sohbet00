import React from 'react';
import { ChevronLeft, Coins, HelpCircle, ListOrdered } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { format } from '../rocket/rocketConfig';
import { OTOBUS_LOGO } from './otobusAssets';

/** Üst şerit: marka, bakiye ve sağdaki iki kare düğme (bahis defteri + kurallar). */
export default function OtobusHeader({ coins, onBack, onBoard, onHelp }) {
  return (
    <header className="ob-top">
      <button type="button" onClick={onBack} aria-label="Oyun merkezine dön" className="ob-back">
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="ob-brand">
        <span className="ob-brand-logo">
          <Image
            src={OTOBUS_LOGO}
            alt="OTOBÜS ROKET"
            className="absolute inset-0 h-full w-full object-cover"
            fittingType="fill"
            quality={90}
          />
        </span>
        <span className="min-w-0">
          <span className="ob-brand-name">OTOBÜS ROKET</span>
          <span className="ob-brand-sub">ÇARPANI YAKALA</span>
        </span>
      </span>

      <span className="ob-balance">
        <Coins className="h-3.5 w-3.5 text-[#f6c65b]" />
        <span className="ob-balance-label">Bakiye:</span>
        <b className="ob-balance-value">{format(coins)}</b>
      </span>

      <button type="button" onClick={onBoard} aria-label="Tüm bahisler ve sonuçlar" className="ob-icon-btn">
        <ListOrdered className="h-4 w-4" />
      </button>
      <button type="button" onClick={onHelp} aria-label="Nasıl oynanır" className="ob-icon-btn">
        <HelpCircle className="h-4 w-4" />
      </button>
    </header>
  );
}