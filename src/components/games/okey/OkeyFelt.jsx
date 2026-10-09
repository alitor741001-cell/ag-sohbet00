import { Image } from '@/components/ui/image';
import OkeySeatProfile from './OkeySeatProfile';
import OkeyTile from './OkeyTile';
import { OKEY_CLASSIC_LOGO, OKEY_LOGO } from './okeyAssets';
import { isWild, slotOf } from './okeyConfig';

// Bir oyuncunun köşesindeki yığında gösterilen en fazla taş: yığın masayı kaplamasın.
const MAX_PILE_TILES = 8;

/** Yeşil çuha masa: dört oyuncu, ortada gösterge ile deste ve her oyuncunun sağında atık taş yığını. */
export default function OkeyFelt({ variant = 'okey101', table, mySeat, canDraw, onDraw, dropActive, onOpenProfile }) {
  const seats = table?.seats || [];
  const seat = mySeat < 0 ? 0 : mySeat;
  const turn = Number(table?.turn) || 0;
  const playing = table?.status === 'playing';
  const discardSeats = table?.discard_seats || [];

  // Atılan taş atan koltukla eşleşir: her oyuncunun taşları kendi köşesindeki yığında birikir.
  const pileOf = (index) => (table?.discards || [])
    .map((tile, at) => ({ tile, seat: discardSeats[at] }))
    .filter((entry) => entry.seat === index)
    .slice(-MAX_PILE_TILES);

  return (
    <div className="okey-felt" data-drop={dropActive ? '1' : '0'}>
      <span className="okey-turn-ring" data-active={playing ? '1' : '0'} />
      <Image
        src={variant === 'okey' ? OKEY_CLASSIC_LOGO : OKEY_LOGO}
        alt=""
        aria-hidden="true"
        className="okey-felt-mark"
        fittingType="fit"
      />

      {seats.map((entry, index) => (
        <OkeySeatProfile
          key={index}
          seat={entry}
          slot={slotOf(index, seat)}
          active={playing && turn === index && !!entry.user_id}
          onOpen={onOpenProfile}
        />
      ))}

      {/* Atılan taşlar: her oyuncunun sağındaki köşede üst üste yığılır. */}
      {seats.map((entry, index) => {
        if (!entry.user_id) return null;
        const pile = pileOf(index);
        if (!pile.length) return null;
        return (
          <div key={`pile-${index}`} className={`okey-pile-stack okey-pile-stack-${slotOf(index, seat)}`}>
            {pile.map((item, at) => (
              <span key={`${item.tile}-${at}`} className="okey-pile-tile" style={{ '--pile-i': at }}>
                <OkeyTile tile={item.tile} size="sm" wild={isWild(item.tile, table?.okey)} />
              </span>
            ))}
          </div>
        );
      })}

      {/* Orta: ortadan çekilen gösterge taşı ve yanında okeyi; önünde altındaki kapalı taşlar. */}
      <div className="okey-center">
        {canDraw ? <span className="okey-pile-hint">DOKUN · ÇEK</span> : null}

        <button type="button" className="okey-open" disabled={!canDraw} onClick={onDraw} aria-label="Ortadan taş çek">
          <span className="okey-open-item">
            {table?.gosterge ? <OkeyTile tile={table.gosterge} /> : null}
            <span className="okey-open-label">GÖSTERGE</span>
          </span>
          <span className="okey-open-item">
            {table?.okey && table.okey !== 'J' ? <OkeyTile tile={table.okey} wild /> : null}
            <span className="okey-open-label">OKEY</span>
          </span>
        </button>

        <button
          type="button"
          className="okey-pile"
          data-ready={canDraw ? '1' : '0'}
          disabled={!canDraw}
          onClick={onDraw}
          aria-label="Ortadan taş çek"
        >
          {[0, 1, 2].map((layer) => (
            <span key={layer} className="okey-pile-card" data-i={layer}>
              <OkeyTile down />
            </span>
          ))}
          <span className="okey-pile-count">{table?.stack_count || 0}</span>
        </button>
      </div>

      {dropActive ? <span className="okey-drop-hint">ORTAYA AT</span> : null}
    </div>
  );
}