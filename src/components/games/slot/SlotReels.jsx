import React, { useEffect, useState } from 'react';
import { SLOT_ART } from '../slotAssets';
import { CELL_STYLE, SLOT_LAYOUT, SYMBOL_CELLS, SYMBOL_IDS } from './slotLayout';

// Tur sırasında makaranın içinden geçen rastgele sembol sayısı (15 = 5 pencere boyu akış).
const RUN = 15;
const FALLBACK = 'ten';

const shuffle = (list) => {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

// Her kaydırmada semboller farklı sırayla ve farklı sembollerle gelir.
const randomRun = (count) => {
  const pool = shuffle(SYMBOL_IDS);
  return Array.from({ length: count }, (_, position) => pool[position % pool.length]);
};

function Tile({ symbol, top, height }) {
  const cell = SYMBOL_CELLS[symbol] || SYMBOL_CELLS[FALLBACK];
  return (
    <span
      className="absolute left-0 w-full"
      style={{
        top,
        height,
        backgroundImage: `url(${SLOT_ART.shell})`,
        backgroundSize: CELL_STYLE.backgroundSize,
        backgroundPosition: `${CELL_STYLE.x[cell.col]} ${CELL_STYLE.y[cell.row]}`,
      }}
    />
  );
}

function ReelFrame({ children }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute overflow-hidden" style={SLOT_LAYOUT.reelWindow}>
      {children}
    </div>
  );
}

/** Makara ızgarası: turda her sütun kendi hızında döner, semboller akar ve turun sonucu üzerine oturur. */
export default function SlotReels({ spinning, grid }) {
  const [strips, setStrips] = useState([]);

  // Şeritler yalnızca tur boyunca vardır; her turda yeniden karılır ve animasyon baştan başlar.
  useEffect(() => {
    setStrips(spinning ? [0, 1, 2, 3, 4].map(() => randomRun(RUN)) : []);
  }, [spinning]);

  if (spinning && strips.length) {
    return (
      <ReelFrame>
        {strips.map((random, index) => {
          const landing = [0, 1, 2].map((row) => grid?.[index]?.[row] || random[row]);
          // Şeridin en üstünde turun sonucu, altında makaranın içinden akan rastgele semboller.
          const tiles = [...landing, ...random];
          const rows = tiles.length / 3;
          return (
            <span key={index} className="absolute top-0 h-full overflow-hidden" style={{ left: `${index * 20}%`, width: '20%' }}>
              <span
                className="slot-reel-scroll absolute left-0 w-full"
                style={{
                  top: 0,
                  height: `${rows * 100}%`,
                  '--reel-from': `-${(((rows - 1) / rows) * 100).toFixed(2)}%`,
                  animationDuration: `${(1 + index * 0.12).toFixed(2)}s`,
                }}
              >
                {tiles.map((symbol, position) => (
                  <Tile
                    key={position}
                    symbol={symbol}
                    top={`${(position / tiles.length) * 100}%`}
                    height={`${100 / tiles.length}%`}
                  />
                ))}
              </span>
            </span>
          );
        })}
      </ReelFrame>
    );
  }

  if (!grid) return null;

  return (
    <ReelFrame>
      {[0, 1, 2, 3, 4].map((col) => (
        <span key={col} className="absolute top-0 h-full" style={{ left: `${col * 20}%`, width: '20%' }}>
          {[0, 1, 2].map((row) => (
            <Tile key={row} symbol={grid?.[col]?.[row] || FALLBACK} top={`${(row / 3) * 100}%`} height="33.333%" />
          ))}
        </span>
      ))}
    </ReelFrame>
  );
}