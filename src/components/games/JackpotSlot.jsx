import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import SlotGrid from '@/components/games/SlotGrid';
import SpinButton from '@/components/games/SpinButton';
import JackpotOverlay from '@/components/games/JackpotOverlay';
import BetPill from '@/components/games/BetPill';
import AutoSpinBar from '@/components/games/AutoSpinBar';
import JackpotHeader from '@/components/games/JackpotHeader';
import useSlotSpin from '@/components/games/useSlotSpin';
import { formatCoins } from '@/components/games/gameHelpers';

/** Jackpot slot — 5 makara × 3 sıra, jackpot havuzları ve tur göstergesiyle. */
export default function JackpotSlot({ session }) {
  const spin = useSlotSpin(session, { game: 'jackpot', scatterId: 'bonus' });
  const { config, profile, history } = session;
  const payout = spin.result?.payout || 0;

  const tickerItems = useMemo(() => {
    const lines = [
      `MEGA JACKPOT ${formatCoins(config?.jackpot_mega)} coin`,
      `BIG JACKPOT ${formatCoins(config?.jackpot_major)} coin`,
      `MINI JACKPOT ${formatCoins(config?.jackpot_mini)} coin`,
    ];
    (history || []).slice(0, 4).forEach((row) => {
      if (Number(row.payout) > 0) lines.push(`${(row.user_name || 'SEN').toUpperCase()} ${formatCoins(row.payout)} coin kazandı`);
    });
    return lines;
  }, [config, history]);

  return (
    <div className="space-surface flex min-h-full flex-col gap-2 rounded-2xl px-2 pb-2 pt-2">
      <JackpotHeader config={config} tickerItems={tickerItems} spins={profile?.total_spins || 0} />

      <div className="relative">
        {payout > 0 && !spin.spinning && (
          <p className="absolute -top-2.5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-game-gold/60 bg-game-deepest/95 px-3 py-1 text-xs font-black text-game-gold shadow-lg">
            WIN +{formatCoins(payout)} 🪙
          </p>
        )}
        <SlotGrid columns={spin.columns} rolling={spin.rolling} symbols={session.symbols} winRows={spin.winRows} skin="jackpot" />
        <JackpotOverlay jackpot={spin.jackpotFlash} />
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-game-gold/35 bg-black/50 py-1.5 text-center">
        <div className="min-w-0">
          <p className="text-[8px] font-black tracking-[0.18em] text-game-cream/70">LINES</p>
          <p className="text-sm font-black tabular-nums text-white">3</p>
        </div>
        <div className="min-w-0 border-x border-white/10">
          <p className="text-[8px] font-black tracking-[0.18em] text-game-cream/70">TOTAL BET</p>
          <p className="truncate text-sm font-black tabular-nums text-white">{formatCoins(spin.bet)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[8px] font-black tracking-[0.18em] text-game-cream/70">WIN</p>
          <p className={`text-sm font-black tabular-nums ${payout > 0 ? 'text-game-gold' : 'text-game-cream/80'}`}>{formatCoins(payout)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="min-w-0 flex-1">
          <BetPill compact value={spin.bet} onChange={spin.setBet} allowed={spin.allowed} label="BET" />
        </div>
        <AutoSpinBar
          running={spin.auto.running}
          remaining={spin.auto.remaining}
          onStart={spin.startAuto}
          onStop={spin.stopAuto}
          disabled={spin.spinning}
          label="AUTO"
        />
        <SpinButton spinning={spin.spinning} disabled={!spin.allowed.length} onClick={spin.spinOnce} label="SPIN" shape="square" />
      </div>

      <div className="mt-auto flex items-center gap-2 rounded-xl border border-game-gold/25 bg-black/45 px-2 py-1.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-game-cream text-[10px] font-black text-game-deepest">
          {(profile?.user_name || 'S').charAt(0).toUpperCase()}
        </span>
        <span className="truncate text-xs font-black tabular-nums text-game-gold">{formatCoins(profile?.coins || 0)}</span>
        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-white/55" />
      </div>
    </div>
  );
}