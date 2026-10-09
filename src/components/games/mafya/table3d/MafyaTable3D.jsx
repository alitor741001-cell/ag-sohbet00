import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SeatChip from './SeatChip';
import useTableStage from './useTableStage';

/** 3D masa: gerçek profil yüzleri sandalyelerde oturur.
    Hedef, listeden değil doğrudan sahnedeki kişiye dokunarak seçilir. */
export default function MafyaTable3D({
  players,
  capacity,
  meId,
  hostId,
  canPick,
  selectedId,
  selfSelectable,
  hint,
  onPick,
}) {
  const hostRef = useRef(null);
  const faceRefs = useRef([]);
  const stateRef = useRef({});
  const [failed, setFailed] = useState(false);

  const seats = useMemo(
    () => Array.from({ length: capacity }, (_, index) => players[index] || null),
    [players, capacity]
  );

  // Kendi koltuğum kameranın tam karşısında oturur.
  const frontIndex = useMemo(() => {
    const index = players.findIndex((player) => player.user_id === meId);
    return index > 0 ? index : 0;
  }, [players, meId]);

  // Sahne her karede bu durumu okur: kim ölü, kim seçili.
  useEffect(() => {
    stateRef.current = {
      seats: seats.map((player) => (
        player ? { alive: player.alive !== false, selected: !!selectedId && player.user_id === selectedId } : null
      )),
      selectedIndex: seats.findIndex((player) => player && player.user_id === selectedId),
    };
  });

  const fail = useCallback(() => setFailed(true), []);
  useTableStage({ hostRef, faceRefs, capacity, frontIndex, stateRef, onFail: fail });

  return (
    <div ref={hostRef} className={`mf-stage${failed ? ' mf-stage-flat' : ''}`}>
      <span aria-hidden="true" className="mf-stage-glow" />
      {hint ? <p className="mf-stage-hint">{hint}</p> : null}
      <div className="mf-stage-chips">
        {seats.map((player, index) => (
          player ? (
            <SeatChip
              key={player.user_id}
              chipRef={(node) => {
                faceRefs.current[index] = node;
              }}
              player={player}
              isMe={player.user_id === meId}
              isHost={player.user_id === hostId}
              selected={!!selectedId && player.user_id === selectedId}
              tappable={!!canPick && player.alive !== false && (player.user_id !== meId || !!selfSelectable)}
              onPick={onPick}
            />
          ) : null
        ))}
      </div>
    </div>
  );
}