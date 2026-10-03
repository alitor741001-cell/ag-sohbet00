const GAMES = [
  { id: 'slot', label: 'Slot', icon: '⚡' },
  { id: 'jackpot', label: 'Jackpot', icon: '👑' },
  { id: 'crash', label: 'Crash', icon: '🚀' },
];

/** Oyun değiştirme çubuğu. */
export default function GameTabs({ value, onChange, disabled = {} }) {
  return (
    <div className="relative z-10 flex shrink-0 items-center gap-1.5 px-2.5 pb-2">
      {GAMES.map((game) => {
        const active = value === game.id;
        const isOff = !!disabled[game.id];
        return (
          <button
            key={game.id}
            type="button"
            disabled={isOff}
            onClick={() => onChange(game.id)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-[11px] font-black tracking-wide transition-transform active:scale-95 ${
              active
                ? 'gold-plate border-game-gold/70 text-[hsl(40_45%_16%)] shadow-[0_0_18px_-6px_hsl(var(--game-gold))]'
                : isOff
                  ? 'border-white/10 bg-black/30 text-white/25'
                  : 'border-game-gold/25 bg-black/40 text-game-cream/80'
            }`}
          >
            <span className="text-sm">{game.icon}</span>
            <span className="truncate">{game.label}</span>
          </button>
        );
      })}
    </div>
  );
}