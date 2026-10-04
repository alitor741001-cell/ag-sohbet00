import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Image } from '@/components/ui/image';
import { SYMBOL_IDS, SYMBOL_TILES } from './luckyConfig';
import useCompleteLuckyTiles from '@/components/games/lucky/useCompleteLuckyTiles';

const COLUMNS = 5;
const ROWS = 4;
// Dönen şerit iki pencere uzunluğundadır: akış kesintisiz aşağı akar.
const LOOP_TILES = ROWS * 2;
// İniş şeridinde sonuç karolarının üstünde duran ara karo sayısı.
const STOP_TILES = 6;
// Sütunlar aynı hızda akar: ızgara hizada kalır, nesneler birbirine karışmaz.
const LOOP_MS = 2200;
// İniş soldan sağa sırayla olur (Slot Frenzy ile aynı).
const SETTLE_MS = 600;
const SETTLE_STEP_MS = 100;
// Karo içi kırpma: komşu karoya taşan kenar görünmez.
const TILE_INSET = 5;

const randomSymbol = () => SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)];
const buildRandom = () => Array.from({ length: LOOP_TILES }, randomSymbol);

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
  // Her karo kendi hücresinin ortasına oturur: komşu karolara taşmaz.
  const inset = (height * TILE_INSET) / 100;
  return (
    <span
      className="absolute left-0 w-full"
      style={{ top: `${top + inset}%`, height: `${height - inset * 2}%` }}
    >
      <span className="block h-full w-full px-[5%]">
      {symbol === 'multi' ? (
        <MultiplierTile value={multiplier || 2} />
      ) : (
        <Image
          src={SYMBOL_TILES[symbol] || SYMBOL_TILES.crown}
          alt=""
          fittingType="fit"
          className="block h-full w-full object-contain"
        />
      )}
      </span>
    </span>
  );
}

function ReelColumn({ index, random, landing, landingMulti, spinning }) {
  const stripRef = useRef(null);
  const [finish, setFinish] = useState(null);
  const loop = useMemo(() => [...random, ...random], [random]);

  // Dönüş bitince şerit, o an görünen karolardan devam ederek sonucu aşağı indirir.
  useLayoutEffect(() => {
    if (spinning) {
      if (finish) setFinish(null);
      return;
    }
    if (finish || !landing || !stripRef.current) return;
    const strip = stripRef.current;
    const transform = new DOMMatrixReadOnly(getComputedStyle(strip).transform);
    const cellHeight = strip.getBoundingClientRect().height / loop.length;
    const position = Math.max(0, -transform.m42 / cellHeight);
    const start = Math.floor(position);
    // Görünen karolar ve kayma miktarı korunur: iniş akışın içinden başlar.
    const visible = loop.slice(start, start + ROWS + 1);
    const tiles = [...landing, ...random.slice(0, STOP_TILES), ...visible];
    setFinish({
      tiles,
      from: -((landing.length + STOP_TILES + position - start) / tiles.length) * 100,
    });
  }, [spinning, finish, landing, loop, random]);

  const tiles = finish?.tiles || loop;
  const settling = Boolean(finish);
  useCompleteLuckyTiles(stripRef, spinning, finish, SETTLE_MS + index * SETTLE_STEP_MS);

  return (
    <div className="relative overflow-hidden">
      <span
        ref={stripRef}
        key={settling ? 'settle' : 'loop'}
        className={`absolute left-0 top-0 w-full ${settling ? 'lucky-reel-settle' : 'lucky-reel-loop'}`}
        style={{
          height: `${(tiles.length / ROWS) * 100}%`,
          '--reel-from': `${finish?.from ?? 0}%`,
          animationDuration: settling ? `${SETTLE_MS + index * SETTLE_STEP_MS}ms` : `${LOOP_MS}ms`,
        }}
      >
        {tiles.map((symbol, i) => (
          <Tile
            key={i}
            symbol={symbol}
            top={(i / tiles.length) * 100}
            height={100 / tiles.length}
            multiplier={settling && i < ROWS ? landingMulti?.[i] || 0 : 0}
          />
        ))}
      </span>
    </div>
  );
}

/** Canlı makara alanı: dönerken karolar aşağı akar, sonuç sütun sütun yerine iner. */
export default function LuckyReels({ grid, multiValues, spinning, spinId }) {
  const randoms = useMemo(
    () => Array.from({ length: COLUMNS }, () => buildRandom()),
    // Her yeni dönüşte şeritler yenilenir.
    [spinId]
  );

  // İlk dönüşten önce görseldeki ızgara birebir görünür.
  if (!grid && !spinning) return null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[0.7rem] border border-slot-gold/60 bg-slot-panel shadow-[inset_0_0_18px_rgba(0,0,0,0.75)]">
      <div className="absolute inset-0 grid grid-cols-5 gap-[2px] p-[2px]">
        {randoms.map((random, col) => (
          <ReelColumn
            key={col}
            index={col}
            random={random}
            landing={grid?.[col]}
            landingMulti={multiValues?.[col]}
            spinning={spinning}
          />
        ))}
      </div>
    </div>
  );
}