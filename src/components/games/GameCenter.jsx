import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import GameHeader from '@/components/games/GameHeader';
import GameTabs from '@/components/games/GameTabs';
import SlotGame from '@/components/games/SlotGame';
import JackpotSlot from '@/components/games/JackpotSlot';
import CrashGame from '@/components/games/CrashGame';
import GameHistorySheet from '@/components/games/GameHistorySheet';
import GameHelpSheet from '@/components/games/GameHelpSheet';
import GameSettingsSheet from '@/components/games/GameSettingsSheet';
import useGameSession from '@/components/games/useGameSession';
import { sounds } from '@/components/games/gameSounds';

/**
 * Oyun Merkezi: sohbetin üzerine açılan panel. Sayfa değiştirmez, sohbet arkada çalışmaya devam eder.
 */
export default function GameCenter({ open, onClose }) {
  const session = useGameSession(open);
  const [game, setGame] = useState('slot');
  const [sheet, setSheet] = useState(null);
  const [muted, setMuted] = useState(sounds.isMuted());
  const [closing, setClosing] = useState(false);

  useEffect(() => { if (open) setClosing(false); }, [open]);
  useEffect(() => { if (!open) setSheet(null); }, [open]);

  if (!open) return null;

  const close = () => {
    sounds.play('click');
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 170);
  };

  const toggleSound = () => {
    const next = !muted;
    sounds.setMuted(next);
    setMuted(next);
    if (!next) sounds.play('click');
  };

  const disabled = {
    slot: session.config?.slot_enabled === false,
    crash: session.config?.crash_enabled === false,
    jackpot: session.config?.jackpot_enabled === false,
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[210] flex items-stretch justify-center bg-black/75 backdrop-blur-[3px] sm:items-center sm:p-4">
      <div
        className={`pointer-events-auto relative flex h-full w-full flex-col overflow-hidden bg-game-bg text-game-fg sm:h-[min(94vh,940px)] sm:max-w-2xl sm:rounded-3xl sm:border sm:border-game-gold/25 sm:shadow-[0_0_70px_-12px_hsl(var(--game-gold)/0.4)] ${closing ? 'game-panel-exit' : 'game-panel-enter'}`}
      >
        <GameHeader
          coins={session.profile?.coins || 0}
          muted={muted}
          onToggleSound={toggleSound}
          onOpenSettings={() => { sounds.play('click'); setSheet('settings'); }}
          onOpenHelp={() => { sounds.play('click'); setSheet('help'); }}
          onOpenHistory={() => { sounds.play('click'); setSheet('history'); }}
          onClose={close}
        />
        <GameTabs value={game} disabled={disabled} onChange={(next) => { sounds.play('click'); setGame(next); }} />

        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
          {session.loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-white/70">
              <Loader2 className="h-7 w-7 animate-spin text-game-gold" />
              Oyun merkezi hazırlanıyor...
            </div>
          ) : session.profile ? (
            game === 'crash'
              ? <CrashGame session={session} onOpenHelp={() => { sounds.play('click'); setSheet('help'); }} onOpenHistory={() => { sounds.play('click'); setSheet('history'); }} />
              : game === 'jackpot'
                ? <JackpotSlot session={session} />
                : <SlotGame session={session} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-white/70">
              Oyun merkezi yüklenemedi.
              <button
                type="button"
                onClick={() => session.call({ action: 'get' })}
                className="flex items-center gap-1.5 rounded-xl border border-game-gold/40 px-3 py-2 text-game-gold"
              >
                <RefreshCw className="h-4 w-4" /> Tekrar dene
              </button>
            </div>
          )}
        </div>

        <GameHistorySheet open={sheet === 'history'} onClose={() => setSheet(null)} session={session} />
        <GameHelpSheet open={sheet === 'help'} onClose={() => setSheet(null)} session={session} />
        <GameSettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} session={session} muted={muted} onToggleSound={toggleSound} />
      </div>
    </div>
  );
}