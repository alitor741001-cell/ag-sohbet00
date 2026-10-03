const GAMES = [
  { id: 'slot', label: 'Slot', icon: '🎰' },
  { id: 'crash', label: 'Crash', icon: '🚀' },
  { id: 'jackpot', label: 'Jackpot', icon: '👑' },
];

/** Oyun değiştirme çubuğu. */
export default function GameTabs({ value, onChange, disabled = {} }) {
  return (
    <div className="shrink-0 border-b border-white/10 bg-game-panel/70 px-2.5 py-2">
      <p className="mb-1.5 text-[9px] font-black tracking-[0.22em] text-white/45">OYUN DEĞİŞTİR</p>
      <div className="flex items-center gap-1.5">
        {GAMES.map((game) => {
          const active = value === game.id;
          const isOff = !!disabled[game.id];
          return (
            <button
              key={game.id}
              type="button"
              disabled={isOff}
              onClick={() => onChange(game.id)}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-bold transition-transform active:scale-95 ${
                active
                  ? 'border-game-gold/70 bg-game-gold/15 text-game-gold shadow-[0_0_18px_-6px_hsl(var(--game-gold))]'
                  : isOff
                    ? 'border-white/5 bg-white/5 text-white/30'
                    : 'border-white/10 bg-white/5 text-white/75'
              }`}
            >
              <span className="text-sm">{game.icon}</span>
              <span className="truncate">{game.label}</span>
              {isOff && <span className="text-[9px]">kapalı</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { GAMES };