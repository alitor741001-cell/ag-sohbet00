import React from 'react';
import { Coins, HelpCircle, Volume2, VolumeX, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { FUTBOL_LOGO } from './futbolAssets';

/** Üst bant: ses solda; marka ortada (kurallara dokunulur), coin ve kapatma sağda. */
export default function FutbolHeader({ roundNo, sound, onSound, onMenu, onCoins, onExit }) {
  return (
    <header className="fut-head">
      <div className="fut-head-row">
        <button
          type="button"
          onClick={onSound}
          aria-label={sound ? 'Sesi kapat' : 'Sesi aç'}
          className={`gctl-pill gctl-icon ${sound ? 'gctl-pill-on' : ''}`}
        >
          {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>

        {/* Nasıl oynanır: oyunun kural menüsünü açar. */}
        <button
          type="button"
          onClick={onMenu}
          aria-label="Nasıl oynanır"
          className="gctl-pill gctl-icon"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        <button type="button" onClick={onMenu} aria-label="Nasıl oynanır" className="fut-brand">
          <Image src={FUTBOL_LOGO} alt="" aria-hidden="true" className="fut-logo" fittingType="fill" quality={80} />
          <span className="fut-brand-text">
            <p className="fut-title">ALTIN GOL</p>
            <p className="fut-tagline">FUTBOL ÇEKİLİŞİ</p>
          </span>
        </button>

        <button type="button" onClick={onCoins} aria-label="Coin yükle" className="gctl-pill gctl-icon">
          <Coins className="h-5 w-5" />
        </button>
        <button type="button" onClick={onExit} aria-label="Oyunu kapat" className="gctl-pill gctl-icon">
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="fut-round">MEVCUT TUR {roundNo}</p>
    </header>
  );
}