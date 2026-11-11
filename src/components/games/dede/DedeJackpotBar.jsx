const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** Referanstaki jackpot plakası: iki yanda ikişer kapsül, ortada büyük altın değer. Oyunun gerçek değerlerini gösterir. */
export default function DedeJackpotBar({ stats }) {
  const side = (label, value, tone, right) => (
    <div className={`djp-cell ${right ? 'djp-cell-r' : ''}`}>
      {!right && <span className={`djp-label ${tone}`}>{label}</span>}
      <span className="djp-value">{value}</span>
      {right && <span className={`djp-label ${tone}`}>{label}</span>}
    </div>
  );
  return (
    <div className="djp">
      <div className="djp-side">
        {side('BAHİS', format(stats.bet), 'djp-blue')}
        {side('BAKİYE', format(stats.coins), 'djp-pink')}
      </div>
      <div className="relative">
        <span className="djp-script">Jackpot</span>
        <div className="djp-center">
          <span className="djp-center-label">KAZANÇ</span>
          <span className="djp-center-value">{format(stats.totalWon)}</span>
        </div>
      </div>
      <div className="djp-side">
        {side('SON', format(stats.win), 'djp-green', true)}
        {side('ÇARPAN', `x${stats.multiplier || 0}`, 'djp-gold', true)}
      </div>
    </div>
  );
}