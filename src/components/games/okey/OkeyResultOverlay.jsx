import { formatBet } from './okeyConfig';

/** El sonucu: kazanan, tutar ve yeni masa seçeneği. */
export default function OkeyResultOverlay({ table, mySeat, onLeave }) {
  if (table?.status !== 'finished') return null;
  const myId = table.seats?.[mySeat]?.user_id || '';
  const won = !!table.winner_id && table.winner_id === myId;

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
        <div className="okey-result-actions">
          <button type="button" className="okey-btn okey-btn-gold" onClick={onLeave}>
            YENİ MASA
          </button>
        </div>
      </div>
    </div>
  );
}