import React, { useMemo } from 'react';
import { Image } from '@/components/ui/image';
import { SYMBOL_IDS, SYMBOL_TILES, SPIN_MS } from './luckyConfig';

const COLUMNS = 5;
const ROWS = 4;
// Kayarken şeritte duran karo sayısı; döngü için ilk 4 karo sonda tekrarlanır.
const STRIP = 14;
// Oturma şeridi: sonuç karolarının üstünde bir pencere dolusu karo durur,
// böylece sonuç yukarıdan kayarak yerine iner.
const LAND_TILES = ROWS * 2;
// Sütunlar soldan sağa sırayla oturur: kayma dalgası.
const LAND_MS = 560;
const LAND_STAGGER = 120;

const randomSymbol = () => SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)];

function buildStrip() {
  const tiles = [];
  for (let index = 0; index < STRIP - ROWS; index += 1) tiles.push(randomSymbol());
  for (let index = 0; index < ROWS; index += 1) tiles.push(tiles[index]);
  return tiles;
}

function MultiplierTile({ value }) {
  return (
    <span className="flex h-full w-full items-center justify-center">
      <span className="flex h-[74%] w-[74%] items-center justify-center rounded-[0.3rem] bg-gradient-to-b from-sky-200 via-cyan-500 to-blue-900 shadow-[0_0_10px_rgba(56,189,248,0.85)]">
        <span className="text-[min(3.6vw,1rem)] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">x{value}</span>
      </span>
    </span>
  );
}

function Tile({ symbol, top, height, multiplier }) {
  return (
    <span className="absolute left-0 w-full overflow-hidden" style={{ top: `${top}%`, height: `${height}%` }}>
      {symbol === 'multi' ? (
        <MultiplierTile value={multiplier || 2} />
      ) : (
        <Image
          src={SYMBOL_TILES[symbol] || SYMBOL_TILES.crown}
          alt=""
          fittingType="fill"
          className="h-full w-full"
        />
      )}
    </span>
  );
}

/** Canlı makara alanı: dönerken şerit akar, sonuç sütun sütun kayarak yerine oturur. */
export default function LuckyReels({ grid, multiValues, spinning, spinId }) {
  const strips = useMemo(
    () => Array.from({ length: COLUMNS }, () => buildStrip()),
    // Her yeni dönüşte şeritler yenilenir.
    [spinId]
  );

  const columns = Array.from({ length: COLUMNS }, (_, col) => grid?.[col] || []);

  // İlk dönüşten önce görseldeki ızgara birebir görünür.
  if (!grid && !spinning) return null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[0.7rem] border border-slot-gold/60 bg-slot-panel shadow-[inset_0_0_18px_rgba(0,0,0,0.75)]">
      <div className="absolute inset-0 grid grid-cols-5 gap-[2px] p-[2px]">
        {columns.map((column, col) => (
          <div key={col} className="relative overflow-hidden">
            {spinning ? (
              <div
                key={`spin-${spinId}-${col}`}
                className="lucky-strip absolute left-0 top-0 w-full"
                // Her sütun biraz farklı hızda kayar: karışık, yavaş bir akış.
                style={{ height: `${(STRIP / ROWS) * 100}%`, animationDuration: `${SPIN_MS + col * 240}ms` }}
              >
                {strips[col].map((symbol, index) => (
                  <Tile key={index} symbol={symbol} top={(index / STRIP) * 100} height={100 / STRIP} />
                ))}
              </div>
            ) : (
              <div
                key={`land-${spinId}-${col}`}
                className="lucky-land absolute left-0 top-0 w-full"
                // Sırayla oturur: soldan sağa kayan yerleşme.
                style={{
                  height: `${(LAND_TILES / ROWS) * 100}%`,
                  animationDuration: `${LAND_MS}ms`,
                  animationDelay: `${col * LAND_STAGGER}ms`,
                }}
              >
                {[...column, ...strips[col].slice(0, ROWS)].map((symbol, index) => (
                  <Tile
                    key={index}
                    symbol={symbol}
                    top={(index / LAND_TILES) * 100}
                    height={100 / LAND_TILES}
                    multiplier={index < ROWS ? multiValues?.[col]?.[index] || 0 : 0}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}