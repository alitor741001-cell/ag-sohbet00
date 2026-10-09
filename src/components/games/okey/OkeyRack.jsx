import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import OkeyBoardBrand from './OkeyBoardBrand';
import OkeyTile from './OkeyTile';
import { isWild, rowSplit } from './okeyConfig';
import { planHand } from './okeyGroups';

// Bu kadar hareketten sonrası sürükleme sayılır; altındaki dokunuş taşı ortaya atmaktır.
const DRAG_THRESHOLD = 6;

/** Elle dizilişte grup sınırları taşlara bağlı kalır: taş kaydırılsa da gruplar ayrı durur. */
function breakPositions(tiles, breakTiles) {
  const pool = [...breakTiles];
  return tiles.reduce((acc, tile, index) => {
    const at = pool.indexOf(tile);
    if (at < 0) return acc;
    pool.splice(at, 1);
    if (index > 0) acc.push(index);
    return acc;
  }, []);
}

/** Alt tahta: taşlar parmakla sürüklenip dizilir, çuha üzerine bırakılırsa ortaya atılır. */
export default function OkeyRack({ hand, drawnTile, okey, mode, sortKey, canDiscard, onDiscard, busy, onDropTarget }) {
  // Elle dizilim: sürüklendikçe bu sıra kullanılır, elden çıkan taş sıradan düşer.
  const [order, setOrder] = useState([]);
  // Taş elle taşınsa bile seçili dizilim (SERİ/ÇİFT) korunur: sıra, düğmeye basılana dek bozulmaz.
  const [manualOrder, setManualOrder] = useState(false);
  // Elle dizilişe geçerken grupların başladığı taşlar: aralıklar bu taşlarla birlikte taşınır.
  const [breakTiles, setBreakTiles] = useState([]);
  const [ghost, setGhost] = useState(null);
  const drag = useRef(null);

  // Dizilim düğmesine basılınca ya da yeni el başlayınca tahta yeniden dizilir.
  useEffect(() => {
    setManualOrder(false);
  }, [sortKey]);

  useEffect(() => {
    setOrder((prev) => {
      const rest = [...hand];
      const kept = prev.filter((tile) => {
        const at = rest.indexOf(tile);
        if (at < 0) return false;
        rest.splice(at, 1);
        return true;
      });
      return [...kept, ...rest];
    });
  }, [hand]);

  // Gruplar hâlinde dizilim: geçerli gruplar bitişik durur, kullanılamayan taşlar sona ayrılır.
  const manual = manualOrder && order.length === hand.length;
  const layout = useMemo(() => {
    if (manual) return { tiles: order, breaks: breakPositions(order, breakTiles) };
    const remaining = [...hand];
    const drawnIndex = drawnTile ? remaining.indexOf(drawnTile) : -1;
    if (drawnIndex >= 0) remaining.splice(drawnIndex, 1);
    const plan = planHand(remaining, mode, okey);
    return drawnIndex < 0 ? plan : {
      ...plan, tiles: [...plan.tiles, drawnTile], breaks: [...plan.breaks, plan.tiles.length],
    };
  }, [manual, order, breakTiles, hand, okey, mode, drawnTile]);
  const breaks = useMemo(() => new Set(layout.breaks), [layout]);
  const rows = rowSplit(layout.tiles);
  // Satırların tahtadaki başlangıç sırası: sürükleme hedefi bu sırayla eşleşir.
  const rowBase = rows.reduce(
    (acc, row, index) => [...acc, index ? acc[index - 1] + rows[index - 1].length : 0],
    [],
  );
  const activeFrom = ghost ? drag.current?.from : null;

  /** Görünen sırayı elle dizilime çevirir. */
  const activate = () => {
    const info = drag.current;
    if (!info || info.active) return;
    info.active = true;
    info.from = info.index;
    info.list = [...layout.tiles];
    // Grupların başladığı taşlar saklanır: elle dizilişte aralıklar korunur.
    setBreakTiles(layout.breaks.map((at) => layout.tiles[at]));
    setManualOrder(true);
    setOrder([...info.list]);
  };

  /** Sürüklenen taşı hedef sıraya taşır. */
  const moveTo = useCallback((target) => {
    const info = drag.current;
    if (!info || Number.isNaN(target) || target === info.from) return;
    const list = info.list;
    list.splice(target, 0, list.splice(info.from, 1)[0]);
    info.from = target;
    setOrder([...list]);
  }, []);

  const onPointerDown = (event, tile, index) => {
    if (drag.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = {
      id: event.pointerId,
      tile,
      index,
      from: index,
      list: null,
      active: false,
      overFelt: false,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture desteklenmezse sürükleme yine devam eder.
    }
  };

  const onPointerMove = (event) => {
    const info = drag.current;
    if (!info || info.id !== event.pointerId) return;
    if (!info.active && Math.hypot(event.clientX - info.startX, event.clientY - info.startY) < DRAG_THRESHOLD) return;
    activate();
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const slot = under?.closest?.('[data-okey-slot]');
    const overFelt = !!under?.closest?.('.okey-felt');
    if (slot) moveTo(Number(slot.getAttribute('data-okey-slot')));
    if (info.overFelt !== overFelt) {
      info.overFelt = overFelt;
      onDropTarget?.(overFelt);
    }
    setGhost({ tile: info.tile, x: event.clientX - info.offsetX, y: event.clientY - info.offsetY });
  };

  const finish = (event, allowDrop) => {
    const info = drag.current;
    if (!info || (event && info.id !== event.pointerId)) return;
    drag.current = null;
    setGhost(null);
    if (info.overFelt) onDropTarget?.(false);
    if (!allowDrop || !canDiscard || busy) return;
    // Kısa dokunuş ya da çuhaya bırakma: taş ortaya gider.
    if (!info.active || info.overFelt) onDiscard(info.tile);
  };

  return (
    <div className="okey-rack-wrap">
      <div className={`okey-rack${canDiscard ? ' okey-rack-ready' : ''}`}>
        <OkeyBoardBrand />
        {rows.map((row, rowIndex) => (
          <div className="okey-row" key={rowIndex}>
            {row.map((tile, tileIndex) => {
              const flat = rowBase[rowIndex] + tileIndex;
              return (
                <button
                  key={`${rowIndex}-${tileIndex}`}
                  type="button"
                  className={`okey-tile-btn${breaks.has(flat) && tileIndex > 0 ? ' okey-tile-break' : ''}${drawnTile && tile === drawnTile && flat === layout.tiles.lastIndexOf(drawnTile) ? ' okey-tile-drawn' : ''}${drawnTile && tile === drawnTile && !manual ? ' okey-tile-drawn-end' : ''}${activeFrom === flat ? ' okey-tile-dragging' : ''}`}
                  data-okey-slot={flat}
                  onPointerDown={(event) => onPointerDown(event, tile, flat)}
                  onPointerMove={onPointerMove}
                  onPointerUp={(event) => finish(event, true)}
                  onPointerCancel={(event) => finish(event, false)}
                  onLostPointerCapture={(event) => finish(event, false)}
                  aria-label={`${tile} taşı`}
                >
                  <OkeyTile tile={tile} wild={isWild(tile, okey)} />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Parmak altındaki taş: oyun panelinin dışına çizilir, böylece kırpılmaz. */}
      {ghost
        ? createPortal(
            <span className="okey-drag-ghost" style={{ left: `${ghost.x}px`, top: `${ghost.y}px` }} aria-hidden="true">
              <OkeyTile tile={ghost.tile} wild={isWild(ghost.tile, okey)} />
            </span>,
            document.body,
          )
        : null}
    </div>
  );
}