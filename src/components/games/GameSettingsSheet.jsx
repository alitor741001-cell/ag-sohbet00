import { Volume2, VolumeX } from 'lucide-react';
import GameSheet from '@/components/games/GameSheet';
import { formatCoins, xpProgress } from '@/components/games/gameHelpers';

/** Oyun ayarları: ses tercihi ve seviye bilgileri. */
export default function GameSettingsSheet({ open, onClose, session, muted, onToggleSound }) {
  const { levelInfo, profile, config, betCap, jackpotMinBet } = session;
  const progress = xpProgress(levelInfo);

  const rows = [
    ['COIN BAKİYESİ', `${formatCoins(profile?.coins || 0)} coin`],
    ['BU SEVİYEDE MAKS. BAHİS', `${formatCoins(betCap || 0)} coin`],
    ['JACKPOT ALT LİMİTİ', `${formatCoins(jackpotMinBet || 0)} coin`],
    ['GÜNLÜK OYUN LİMİTİ', config?.daily_limit > 0 ? `${formatCoins(config.daily_limit)} coin` : 'limitsiz'],
  ];

  return (
    <GameSheet open={open} onClose={onClose} title="AYARLAR" subtitle="Oyun tercihleri hesabında saklanır">
      <button
        type="button"
        onClick={onToggleSound}
        className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-2.5 py-2.5 text-left"
      >
        {muted ? <VolumeX className="h-4 w-4 text-game-gold" /> : <Volume2 className="h-4 w-4 text-game-gold" />}
        <span className="min-w-0 flex-1 text-[12px] font-bold text-white">Oyun sesleri</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${muted ? 'bg-white/10 text-white/60' : 'bg-game-green/20 text-game-green'}`}>
          {muted ? 'KAPALI' : 'AÇIK'}
        </span>
      </button>

      <div className="mt-2 rounded-xl border border-white/10 bg-black/30 px-2.5 py-2">
        <div className="flex items-center justify-between text-[11px] font-black text-white">
          <span>SEVİYE {levelInfo?.level || 1}</span>
          <span className="tabular-nums text-white/60">{progress.label}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-game-gold to-game-pink" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="mt-1 text-[10px] text-white/50">
          {progress.next ? `Seviye ${progress.next} bahis sınırını yükseltir.` : 'En yüksek seviyedesin, tüm bahis kademeleri açık.'}
        </p>
      </div>

      <div className="mt-2 space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-2.5 py-1.5">
            <span className="min-w-0 flex-1 text-[10px] font-black tracking-widest text-white/50">{label}</span>
            <span className="shrink-0 text-[11px] font-black tabular-nums text-game-gold">{value}</span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-white/45">
        Oyun coinleri gerçek para değildir; satın alınamaz, çekilemez ve ödeme sistemleriyle ilişkili değildir.
      </p>
    </GameSheet>
  );
}