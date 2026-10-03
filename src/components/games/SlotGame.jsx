import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import SlotGrid from '@/components/games/SlotGrid';
import SpinButton from '@/components/games/SpinButton';
import JackpotOverlay from '@/components/games/JackpotOverlay';
import BetPill from '@/components/games/BetPill';
import AutoSpinBar from '@/components/games/AutoSpinBar';
import ZeusHero from '@/components/games/ZeusHero';
import useSlotSpin from '@/components/games/useSlotSpin';
import { formatCoins } from '@/components/games/gameHelpers';
import { sounds } from '@/components/games/gameSounds';

const FREE_PACKAGE = { cost: 200000, spins: 10 };

/** Zeus slot — 5 makara × 3 sıra. Tüm sonuçlar sunucudan gelir. */
export default function SlotGame({ session }) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const spin = useSlotSpin(session, { game: 'slot', scatterId: 'bonus' });
  const payout = spin.result?.payout || 0;

  const buyFreeSpins = () => {
    sounds.play('click');
    toast({
      title: 'Ücretsiz Döndürme Satın Al',
      description: `${formatCoins(FREE_PACKAGE.cost)} coin karşılığı ${FREE_PACKAGE.spins} ücretsiz dönüş paketi sunucu tarafında henüz aktif değil.`,
    });
  };

  return (
    <div className="zeus-surface flex min-h-full flex-col gap-2.5 rounded-2xl px-2 pb-2 pt-2">
      <ZeusHero avatar={user?.avatar} scatterCount={spin.scatterCount} />

      <div className="relative">
        {payout > 0 && !spin.spinning && (
          <p className="absolute -top-2.5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-game-gold/60 bg-game-deepest/95 px-3 py-1 text-xs font-black text-game-gold shadow-lg">
            KAZANÇ +{formatCoins(payout)} 🪙
          </p>
        )}
        <SlotGrid columns={spin.columns} rolling={spin.rolling} symbols={session.symbols} winRows={spin.winRows} skin="zeus" />
        <JackpotOverlay jackpot={spin.jackpotFlash} />
      </div>

      <p className="text-center text-[12px] font-black text-game-gold">Başlatmak için DÖNDÜR'e dokunun</p>

      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={buyFreeSpins}
          className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-game-violet/70 bg-gradient-to-b from-game-violet/70 to-game-deep px-2 py-2 text-center transition-transform active:scale-95"
        >
          <span className="text-[10px] font-black leading-tight text-white">Ücretsiz Döndürme Satın Al</span>
          <span className="text-[11px] font-black text-game-gold">{formatCoins(FREE_PACKAGE.cost)}</span>
        </button>
        <SpinButton spinning={spin.spinning} disabled={!spin.allowed.length} onClick={spin.spinOnce} label="SPIN" shape="pill" />
        <div className="flex-1 rounded-2xl border border-game-gold/25 bg-game-cream/10" />
      </div>

      <div className="mt-auto flex items-center gap-1.5">
        <AutoSpinBar
          running={spin.auto.running}
          remaining={spin.auto.remaining}
          onStart={spin.startAuto}
          onStop={spin.stopAuto}
          disabled={spin.spinning}
        />
        <div className="min-w-0 flex-1">
          <BetPill value={spin.bet} onChange={spin.setBet} allowed={spin.allowed} label="TOTAL BET" />
        </div>
      </div>
    </div>
  );
}