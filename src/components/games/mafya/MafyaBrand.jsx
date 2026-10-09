import React from 'react';
import { Crown, Crosshair } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { MAFYA_LOGO } from './mafyaAssets';

/** Marka: altın taç ve tabanca işaretli amblem ile ÇEYREK MAFYA başlığı. */
export default function MafyaBrand({ compact = false }) {
  return (
    <div className={`mf-brand${compact ? ' mf-brand-compact' : ''}`}>
      <Image
        src={MAFYA_LOGO}
        alt=""
        aria-hidden="true"
        className="mf-brand-mark"
        fittingType="fill"
        quality={85}
      />
      <span className="mf-brand-copy">
        <Crown className="mf-brand-crown" aria-hidden="true" />
        <span className="mf-brand-title">ÇEYREK MAFYA</span>
        <Crosshair className="mf-brand-gun" aria-hidden="true" />
        {!compact && <span className="mf-brand-sub">KİM DOST KİM DÜŞMAN? ÇEYREKTE BELLİ OLUR!</span>}
      </span>
    </div>
  );
}