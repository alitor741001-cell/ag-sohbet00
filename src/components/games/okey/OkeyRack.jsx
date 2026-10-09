import { useMemo } from 'react';
import OkeyTile from './OkeyTile';
import { arrangeTiles, isWild, rowSplit } from './okeyConfig';

/** Alt tahta: iki sıra taş ve yanlarda seri/çifte dizme düğmeleri. */
export default function OkeyRack({ hand, okey, mode, onMode, canDiscard, onDiscard, busy }) {
  const rows = useMemo(() => rowSplit(arrangeTiles(hand, mode)), [hand, mode]);

  return (
    <div className="okey-rack-wrap">
      <button type="button" className="okey-side" data-on={mode === 'seri' ? '1' : '0'} onClick={() => onMode('seri')}>
        SERİ DİZ
      </button>

      <div className="okey-rack">
        {rows.map((row, rowIndex) => (
          <div className="okey-row" key={rowIndex}>
            {row.map((tile, tileIndex) => (
              <button
                key={`${tile}-${rowIndex}-${tileIndex}`}
                type="button"
                className="okey-tile-btn"
                disabled={!canDiscard || busy}
                onClick={() => canDiscard && onDiscard(tile)}
                aria-label={`${tile} taşını ortaya at`}
              >
                <OkeyTile tile={tile} wild={isWild(tile, okey)} />
              </button>
            ))}
          </div>
        ))}
      </div>

      <button type="button" className="okey-side" data-on={mode === 'cift' ? '1' : '0'} onClick={() => onMode('cift')}>
        ÇİFTE DİZ
      </button>
    </div>
  );
}