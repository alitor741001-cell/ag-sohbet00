import React from 'react';
import { ChevronLeft, Menu, Volume2, VolumeX, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { FUTBOL_LOGO } from './futbolAssets';
import { MODES } from './futbolConfig';

/** Üst bant: mod seçici, ses/menü düğmeleri, oyun markası ve tur numarası. */
export default function FutbolHeader({ mode, roundNo, sound, onMode, onSound, onMenu, onBack, onExit }) {
  return (
    <header className="fut-head">
      <div className="fut-mode" role="tablist" aria-label="Oyun modu">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            title={item.hint}
            onClick={() => onMode(item.id)}
            className={`fut-mode-btn ${mode === item.id ? 'fut-mode-btn-on' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="fut-head-row">
        <div className="fut-head-side">
          <button
            type="button"
            onClick={onSound}
            aria-label={sound ? 'Sesi kapat' : 'Sesi aç'}
            className={`fut-circle ${sound ? 'fut-circle-sound' : ''}`}
          >
            {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          <button type="button" onClick={onMenu} aria-label="Menü ve kurallar" className="fut-circle">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="fut-brand">
          <Image src={FUTBOL_LOGO} alt="" aria-hidden="true" className="fut-logo" fittingType="fill" quality={80} />
          <span className="fut-brand-text">
            <p className="fut-title">ALTIN GOL</p>
            <p className="fut-tagline">FUTBOL ÇEKİLİŞİ</p>
          </span>
        </div>

        <div className="fut-head-side fut-head-side-end">
          <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="fut-circle">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={onExit} aria-label="Oyunu kapat" className="fut-circle">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <p className="fut-round">MEVCUT TUR {roundNo}</p>
    </header>
  );
}