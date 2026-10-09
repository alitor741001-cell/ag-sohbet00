import { formatBet } from './okeyConfig';

/** El sonucu: kazanan, tutar ve yeni masa seçeneği. */
export default function OkeyResultOverlay({ table, mySeat, onLeave }) {
  if (table?.status !== 'finished') return null;
  const myId = table.seats?.[mySeat]?.user_id || '';
  const won = !!table.winner_id && table.winner_id === myId;
  // El sonu hesabı: her oyuncunun elinde kalan taşların puanı.
  const scores = table.final_scores || [];
  const winnerSeat = (table.seats || []).findIndex((seat) => seat.user_id && seat.user_id === table.winner_id);

  return (
    <div className="okey-result">
      <div className="okey-result-card">
        <p className="okey-result-title">
          {won ? 'KAZANDIN!' : table.winner_id ? 'EL BİTTİ' : 'BERABERE'}
        </p>
        {won ? <p className="okey-result-amount">+{formatBet(table.win_amount)} coin</p> : null}
        <p className="okey-result-text">
          {won
            ? `Üç oyuncunun bahsini de aldın: pot ${formatBet(table.win_amount)} coin hesabına eklendi.`
            : table.winner_id
              ? `${table.winner_name} bitirdi ve ${formatBet(table.win_amount)} coin potu aldı.`
              : 'Orta bitti ve kimse bitiremedi — bahisler iade edildi.'}
        </p>
        {scores.length ? (
          <div className="okey-result-scores">
            <p className="okey-result-scores-title">ELDE KALAN TAŞLAR</p>
            {scores.map((entry) => (
              <div
                key={entry.seat}
                className="okey-result-score"
                data-winner={entry.seat === winnerSeat ? '1' : '0'}
              >
                <span className="okey-result-score-name">{entry.name || `Koltuk ${entry.seat + 1}`}</span>
                <span className="okey-result-score-value">{entry.score} puan</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="okey-result-actions">
          <button type="button" className="okey-btn okey-btn-gold" onClick={onLeave}>
            YENİ MASA
          </button>
        </div>
      </div>
    </div>
  );
}