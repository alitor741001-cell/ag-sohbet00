import { ChevronLeft, ChevronRight, Crown, HelpCircle } from 'lucide-react';
import { Image } from '@/components/ui/image';
import DedeWizard from '@/components/games/dede/DedeWizard';
import DedeJackpotBar from '@/components/games/dede/DedeJackpotBar';
import { DEDE_ART } from '@/components/games/dede/dedeAssets';
import { useCurrentUser } from '@/lib/useCurrentUser';
import '@/components/games/dede/dedeTop.css';

/** Dede üst sahnesi: tapınak gökyüzü, ortada Dede, scatter bandı ve jackpot plakası. */
export default function DedeHeader({ onBack, onHelp, orbs, spinKey, rolling, spinning, stats }) {
  const { user } = useCurrentUser();
  const avatar = user?.avatar_url || user?.avatar || '';
  return (
    <header className="dede-top relative z-20 shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <span aria-hidden="true" className="dede-top-temple" />
      <div className="relative z-10 flex items-center gap-2 px-3">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="dede-top-orb">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="dede-top-pill">
          <span className="dede-top-crown"><Crown className="h-3.5 w-3.5" /></span>
          <span className="tabular-nums">{stats.sessionSpins || 0}</span>
          <ChevronRight className="ml-auto h-4 w-4 text-[#f5b342]" />
        </span>
        <button type="button" onClick={onHelp} aria-label="Nasıl oynanır" className="dede-top-orb ml-auto">
          <HelpCircle className="h-5 w-5" strokeWidth={2.6} />
        </button>
      </div>

      <div className="dede-top-rank">
        <span className="dede-top-rank-ring">
          {avatar ? <Image src={avatar} alt="" className="h-full w-full rounded-full" fittingType="fill" quality={60} />
            : <span className="flex h-full w-full items-center justify-center text-sm font-black text-[#6b3a05]">{(user?.full_name || '?').charAt(0)}</span>}
        </span>
        <span className="dede-top-rank-no">NO.1</span>
      </div>

      <DedeWizard orbs={orbs} spinKey={spinKey} rolling={rolling} spinning={spinning} />

      <div className="dede-top-banner">
        <span className="dede-top-banner-n">4</span>
        <Image src={DEDE_ART.dede} alt="Scatter" fittingType="fit" blurPlaceholder={false} className="dede-top-banner-icon" />
        <span className="truncate">Ücretsiz Dönüş modunu açar</span>
      </div>
      <DedeJackpotBar stats={stats} />
    </header>
  );
}