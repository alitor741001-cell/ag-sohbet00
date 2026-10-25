import { ChevronLeft, HelpCircle } from 'lucide-react';
import DedeWizard from '@/components/games/dede/DedeWizard';

export default function DedeHeader({ onBack, onHelp, orbs, spinKey, rolling, spinning }) {
  return (
    <header className="dede-header relative z-10 flex shrink-0 items-start gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="relative z-10 flex shrink-0 flex-col gap-2">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" onClick={onHelp} aria-label="Nasıl oynanır" className="gctl-pill gctl-icon">
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
      <div className="dede-header-copy min-w-0 flex-1 self-center text-center">
        <p className="dede-title text-lg">DEDE</p>
        <p className="dede-header-subtitle text-[9px] font-black tracking-[0.14em]">ÇARPAN KÜRELERİ · 4+ SCATTER 15 ÇEVİRME HAKKI</p>
      </div>
      <DedeWizard orbs={orbs} spinKey={spinKey} rolling={rolling} spinning={spinning} />
    </header>
  );
}