import React from 'react';
import { X } from 'lucide-react';
import EliminArt from './EliminArt';
import useBackDismiss from '@/hooks/useBackDismiss';
import {
  CHEST_MAX,
  CHICKEN_MIN,
  CLUSTER_MIN,
  DICE_MIN,
  ELIMIN_SYMBOLS,
  FREE_SPINS,
  JACKPOT_PER_CHEST,
  LINES,
  formatCoins,
} from './eliminConfig';

// Ödeme sütun başlıkları: küme büyüdükçe bahis katı artar.
const HEADINGS = [
  `${CLUSTER_MIN}-${CLUSTER_MIN + 2}`,
  `${CLUSTER_MIN + 3}-${CLUSTER_MIN + 5}`,
  `${CLUSTER_MIN + 6}+`,
];

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
          <button type="button" onClick={onClose} aria-label="Kapat" className="gctl-pill gctl-icon">
            <X className="h-5 w-5" />
          </button>
        </header>

        <ul className="el-rules">
          <li>Aynı meyveden {CLUSTER_MIN} ve üzeri gelince küme öder; yan yana olması gerekmez.</li>
          <li>Toplam bahis = bahis x {LINES} satır.</li>
          <li>4 ve üzeri altın muz bonus öder.</li>
          <li>{CHICKEN_MIN} tavuk gelince {FREE_SPINS} bedava tur kazanılır; turlar sırayla çevrilir.</li>
          <li>Sandık geldikçe sandık barında birikir; bar {CHEST_MAX} sandıkta dolar.</li>
          <li>Bardaki her sandık bahsin {JACKPOT_PER_CHEST} katı kadar birikir; bar dolunca sandığa basıp topla.</li>
          <li>Jackpot havuzu kaybedilen turlarda birikir, kazanan turlarda azalır.</li>
          <li>{DICE_MIN} zar gelince jackpot patlar ve havuzun yarısı ödenir.</li>
          <li>Çevirme hakkı ve bedava tur turları bahis almaz.</li>
        </ul>

        <div className="el-pay-head">
          <span />
          {HEADINGS.map((heading) => <span key={heading}>{heading}</span>)}
        </div>

        <ul className="el-pay">
          {Object.entries(ELIMIN_SYMBOLS).map(([id, symbol]) => (
            <li key={id} className="el-pay-row">
              <span className="el-pay-name">
                <EliminArt src={symbol.art} alt={symbol.name} className="el-pay-art" />
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

        <p className="el-pay-note">Değerler bahis katıdır: 100 bahis 10-11 yaban mersini = 5.400 coin.</p>
      </div>
    </div>
  );
}