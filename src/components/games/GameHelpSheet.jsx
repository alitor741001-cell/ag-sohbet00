import GameSheet from '@/components/games/GameSheet';
import { formatCoins } from '@/components/games/gameHelpers';

/** Ödül tablosu ve oyun kuralları. */
export default function GameHelpSheet({ open, onClose, session }) {
  const { symbols = [], config, jackpotMinBet, levelInfo } = session;
  const payLines = (symbol) => [3, 4, 5].map((count) => symbol.pays?.[count] ?? 0);
  const tiers = [
    ['Mini', '⭐ Yıldız', config?.jackpot_mini],
    ['Major', '💎 Mücevher', config?.jackpot_major],
    ['Mega', '👑 Taç', config?.jackpot_mega],
  ];

  return (
    <GameSheet open={open} onClose={onClose} title="ÖDÜL TABLOSU" subtitle="Kazançlar bahsin katı olarak ödenir">
      <div className="space-y-1">
        {symbols.map((symbol) => {
          const [three, four, five] = payLines(symbol);
          return (
            <div key={symbol.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-2 py-1.5">
              <span className="text-lg">{symbol.icon}</span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white/80">{symbol.label}</span>
              <span className="shrink-0 text-[10px] font-black tabular-nums text-white/60">3 → {three}x</span>
              <span className="shrink-0 text-[10px] font-black tabular-nums text-white/60">4 → {four}x</span>
              <span className="shrink-0 text-[10px] font-black tabular-nums text-game-gold">5 → {five}x</span>
            </div>
          );
        })}
      </div>

      <h4 className="mt-3 text-[11px] font-black tracking-widest text-game-violet">JACKPOT</h4>
      <div className="mt-1 space-y-1">
        {tiers.map(([label, symbolsLabel, value]) => (
          <div key={label} className="flex items-center gap-2 rounded-xl border border-game-violet/25 bg-game-violet/10 px-2 py-1.5">
            <span className="text-[11px] font-black text-white/80">{label}</span>
            <span className="min-w-0 flex-1 truncate text-[10px] text-white/55">{symbolsLabel} orta hat 5'li</span>
            <span className="shrink-0 text-xs font-black tabular-nums text-game-gold">{formatCoins(value || 0)}</span>
          </div>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-white/50">Jackpot {formatCoins(jackpotMinBet)} coin ve üzeri bahislerde açılır. Havuz her spinle büyür.</p>

      <h4 className="mt-3 text-[11px] font-black tracking-widest text-game-neon">OYUN KURALLARI</h4>
      <ul className="mt-1 space-y-1 text-[11px] leading-relaxed text-white/65">
        <li>• Slot: soldan başlayan 3 sembol eşleşmesi kazandırır, FilmKeyfi sembolü joker sayılır. 3 yatay hat vardır.</li>
        <li>• Bonus sembolü nerede gelirse gelsin 3 ve üzeri sayıda bonus ödemesi yapar.</li>
        <li>• Crash: çarpan 1.00x'ten başlar, roket patlamadan ÇEKİL dersen bahis × çarpan kadar coin kazanırsın. Hedef seçersen otomatik çekilir.</li>
        <li>• Coinler gerçek para değildir, çekilemez. Yalnızca FilmKeyfi içi sanal oyun ekonomisidir.</li>
        <li>• Seviye {levelInfo?.level || 1} · bu seviyede maksimum bahis {formatCoins(levelInfo?.bet_cap || 0)} coin. Oynadıkça seviye ve bahis sınırın artar.</li>
      </ul>
    </GameSheet>
  );
}