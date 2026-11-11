import { ChevronLeft, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { Image } from '@/components/ui/image';

import artwork from '@/components/games/shared/gameThemeArtwork';

/** Görsel başlık: oyunun mevcut geri, yardım ve ses kontrollerini korur. */
export default function GameIllustratedHeader({ game, title, tagline, onBack, onHelp, sound, onSound, round }) {
  return (
    <header className="relative z-10 w-full shrink-0 overflow-hidden border-b-2 border-slot-gold bg-slot-surface [container-type:inline-size]">
      <Image src={artwork[game]} alt={title} className="block h-[clamp(90px,27vw,170px)] w-full" fittingType="fill" quality={90} loading="eager" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon bg-slot-surface/80 text-slot-text"><ChevronLeft className="h-5 w-5" /></button>
        <div className="flex items-center gap-2">
          {round !== undefined && <span className="rounded-full bg-slot-surface/80 px-2 py-1 text-xs font-black text-slot-text">Tur:{round || '—'}</span>}
          {onSound && <button type="button" onClick={onSound} aria-label={sound ? 'Sesi kapat' : 'Sesi aç'} className={`gctl-pill gctl-icon bg-slot-surface/80 text-slot-text ${sound ? 'gctl-pill-on' : ''}`}>{sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>}
          {onHelp && <button type="button" onClick={onHelp} aria-label="Nasıl oynanır" className="gctl-pill gctl-icon bg-slot-surface/80 text-slot-text"><HelpCircle className="h-5 w-5" /></button>}
        </div>
      </div>
      {tagline && <p className="absolute inset-x-0 bottom-0 bg-slot-surface/75 py-0.5 text-center text-[9px] font-black tracking-wider text-slot-text">{tagline}</p>}
    </header>
  );
}