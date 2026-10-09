import { Image } from '@/components/ui/image';
import OkeySeatProfile from './OkeySeatProfile';
import OkeyTile from './OkeyTile';
import { OKEY_LOGO } from './okeyAssets';
import { discardSpot, isWild, slotOf } from './okeyConfig';

/** Yeşil çuha masa: dört oyuncu, ortada deste, gösterge ve atılan taşlar. */
export default function OkeyFelt({ table, mySeat }) {
  const seats = table?.seats || [];
  const discards = (table?.discards || []).slice(-9);
  const turn = Number(table?.turn) || 0;
  const playing = table?.status === 'playing';
  const seat = mySeat < 0 ? 0 : mySeat;

  return (
    <div className="okey-felt">
      <span className="okey-turn-ring" data-active={playing ? '1' : '0'} />
      <Image src={OKEY_LOGO} alt="" aria-hidden="true" className="okey-felt-mark" fittingType="fit" />

      {/* Gösterge ve okey: masanın sol üst köşesinde herkes görür. */}
      <div className="okey-indicator">
        <span className="okey-indicator-label">
          <span className="okey-indicator-text">GÖSTERGE</span>
          <span className="okey-indicator-okey">OKEY · {table?.okey || '—'}</span>
        </span>
        {table?.gosterge ? <OkeyTile tile={table.gosterge} size="xs" /> : null}
        {table?.okey && table.okey !== 'J' ? <OkeyTile tile={table.okey} size="xs" wild /> : null}
      </div>

      {seats.map((entry, index) => (
        <OkeySeatProfile
          key={index}
          seat={entry}
          slot={slotOf(index, seat)}
          active={playing && turn === index && !!entry.user_id}
        />
      ))}

      {/* Ortaya atılan taşlar dağınık durur. */}
      <div className="okey-discards">
        {discards.map((tile, index) => (
          <span key={`${tile}-${index}`} className="okey-drop" style={discardSpot(index)}>
            <OkeyTile tile={tile} size="sm" wild={isWild(tile, table?.okey)} />
          </span>
        ))}
      </div>

      {/* Orta: kapalı deste ve kalan taş sayısı. */}
      <div className="okey-center">
        <div className="okey-pile">
          {[0, 1, 2].map((layer) => (
            <span key={layer} className="okey-pile-card" data-i={layer}>
              <OkeyTile down />
            </span>
          ))}
          <span className="okey-pile-count">{table?.stack_count || 0}</span>
        </div>
      </div>
    </div>
  );
}