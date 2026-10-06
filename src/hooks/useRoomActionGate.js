import { useCallback, useRef } from 'react';

// Each target/action is locked synchronously, before React's next render.
export default function useRoomActionGate(roomId) {
  const pending = useRef(new Set());
  const begin = useCallback((action) => {
    const key = `${roomId}:${action}`;
    if (pending.current.has(key)) return false;
    pending.current.add(key);
    return true;
  }, [roomId]);
  const end = useCallback((action) => pending.current.delete(`${roomId}:${action}`), [roomId]);
  return { begin, end };
}