import { Lock, Plus } from 'lucide-react';

/** Boş kartlar da mevcut koltuk seçme/kilitleme akışını açar. */
export default function TeamPkSide({ tone, indices, renderSeat, onSelectSeat, size, space, seats = [] }) {
  return (
    <div className="team-pk-side" data-tone={tone}>
      {indices.map((index) => (
        <div key={index} className="team-pk-seat-card">
          <span className="team-pk-card-lines" aria-hidden="true" />
          {seats[index]?.user_id ? (
            <div className="team-pk-card-person">{renderSeat(index, size, space)}</div>
          ) : (
            <button type="button" onClick={() => onSelectSeat(index)} className="team-pk-empty" aria-label={`${index}. koltuk${seats[index]?.locked ? ', kilitli' : ''}`}>
              <span className="team-pk-diamond">{seats[index]?.locked ? <Lock /> : <Plus />}</span>
              <span className="team-pk-card-number">{index}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}