import React from 'react';
import { X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import useBackDismiss from '@/hooks/useBackDismiss';
import {
  ART_SIZE,
  CHEST_MAX,
  CHICKEN_FREE_SPINS,
  CHICKEN_MIN,
  DICE_MIN,
  ELIMIN_SYMBOLS,
  FREE_MAX,
  JACKPOT_PER_CHEST,
  LINES,
  formatCoins,
} from './eliminConfig';

// Ödeme sütun başlıkları: küme büyüdükçe bahis katı artar.
const HEADINGS = ['8-9', '10-11', '12+'];

/** Nasıl oynanır: küme kuralı, altın muz bonusu ve ödeme tablosu. */
export default function EliminRulesSheet({ open, onClose }) {
  useBackDismiss(open, onClose);
  if (!open) return null;

  return (
    <div className="el-sheet">
      <button type="button" aria-label="Kapat" onClick={onClose} className="el-sheet-veil" />
      <div className="el-sheet-body">
        <header className="el-sheet-head">
          <p>NASIL OYNANIR</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="el-icon">
            <X className="h-5 w-5" />
          </button>
        </header>

        <ul className="el-rules">
          <li>Aynı meyveden 8 ve üzeri gelince küme öder; yan yana olması gerekmez.</li>
          <li>Toplam bahis = bahis x {LINES} satır.</li>
          <li>4 ve üzeri altın muz bonus öder ve {FREE_MAX} bedava tur verir.</li>
          <li>{CHICKEN_MIN} tavuk gelince ücretsiz {CHICKEN_FREE_SPINS} çevirme hakkı verir.</li>
          <li>Sandık geldikçe jackpot barında birikir; bar {CHEST_MAX} sandıkta dolar.</li>
          <li>Bardaki her sandık jackpota bahsin {JACKPOT_PER_CHEST} katı ekler, tutar bahis kademesiyle yükselir.</li>
          <li>{DICE_MIN} zar gelince jackpot patlar ve biriken tutarın yarısı ödenir.</li>
          <li>Bedava turlar bahis almaz; SPIN ile elle çevrilir.</li>
        </ul>

        <div className="el-pay-head">
          <span />
          {HEADINGS.map((heading) => <span key={heading}>{heading}</span>)}
        </div>

        <ul className="el-pay">
          {Object.entries(ELIMIN_SYMBOLS).map(([id, symbol]) => (
            <li key={id} className="el-pay-row">
              <span className="el-pay-name">
                <Image
                  src={symbol.art}
                  alt={symbol.name}
                  className="el-pay-art"
                  fittingType="fit"
                  originWidth={ART_SIZE}
                  originHeight={ART_SIZE}
                  quality={80}
                />
                <span>
                  {symbol.name}
                  {symbol.tag && <em className="el-pay-tag">{symbol.tag}</em>}
                </span>
              </span>
              {/* Meyveler bahis katı öder; ek nesneler kendi kuralını yazar. */}
              {symbol.pays
                ? symbol.pays.map((pay, index) => (
                  <span key={HEADINGS[index]} className="el-pay-value">{formatCoins(pay)}</span>
                ))
                : <span className="el-pay-note-cell">{symbol.note}</span>}
            </li>
          ))}
        </ul>

        <p className="el-pay-note">Değerler bahis katıdır: 100 bahis 8-9 lolipop = 14.400 coin.</p>
      </div>
    </div>
  );
}