import { Play } from 'lucide-react';
import { OKEY_MIN_PLAYERS, formatBet } from './okeyConfig';

/** Bekleme odası: bahsi artır, 2-3 oyuncuyla başlat ya da ayrıl. */
export default function OkeyWaitRoom({ table, mySeat, coins, busy, onStake, onStart, onLeave }) {
  const base = Number(table?.base_bet) || 0;
  const seats = table?.seats || [];
  const mine = seats[mySeat] || null;
  const stake = Number(mine?.stake) || base;
  const filled = seats.filter((seat) => seat.user_id).length;
  const max = Math.max(base, Math.floor(coins / base) * base);
  const canStart = filled >= OKEY_MIN_PLAYERS;

  return (
    <div className="okey-rack-wrap">
      <div className="okey-rack">
        <div className="okey-wait">
          <div className="okey-wait-card">
            <div className="okey-stake-row">
              <span className="okey-section-title">BAHSİM</span>
              <button type="button" className="okey-btn" disabled={busy || stake <= base} onClick={() => onStake(stake - base)}>
                −
              </button>
              <span className="okey-stake-value">{formatBet(stake)}</span>
              <button type="button" className="okey-btn" disabled={busy || stake + base > max} onClick={() => onStake(stake + base)}>
                +
              </button>
              <button type="button" className="okey-btn okey-btn-gold" disabled={busy || stake >= max} onClick={() => onStake(max)}>
                MAKS
              </button>
            </div>
            <p className="okey-lobby-text">
              Bahsini istediğin kadar artırabilirsin; kazanan potun tamamını alır. Bahisler oyun başlarken cüzdandan
              düşülür.
            </p>
          </div>

          <p className="okey-section-title">
            MASA {table?.code} · {filled}/4 OYUNCU
          </p>
          {seats.map((seat, index) => (
            <p key={index} className="okey-seat-line">
              <span className="okey-seat-line-name">
                {index + 1}. {seat.user_id ? seat.name : 'boş yer'}
              </span>
              <span className="okey-chip-value">{seat.user_id ? `${formatBet(seat.stake)} coin` : '—'}</span>
            </p>
          ))}

          <button
            type="button"
            className="okey-btn okey-btn-gold justify-center py-2.5 text-sm"
            disabled={busy || !canStart}
            onClick={onStart}
          >
            <Play className="h-4 w-4" /> OYUNU BAŞLAT
          </button>
          <p className="okey-lobby-text">
            {canStart
              ? `${filled} oyuncuyla hemen başlayabilirsin; 4 oyuncu dolunca oyun kendiliğinden başlar.`
              : `Başlamak için en az ${OKEY_MIN_PLAYERS} oyuncu gerekli.`}
          </p>

          <button type="button" className="okey-btn okey-btn-red justify-center" onClick={onLeave}>
            MASADAN AYRIL
          </button>
        </div>
      </div>
    </div>
  );
}