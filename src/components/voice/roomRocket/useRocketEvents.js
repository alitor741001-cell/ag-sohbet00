import { useEffect, useRef, useState } from 'react';

export default function useRocketEvents(roomId, data) {
  const observed = useRef({ room: null, ordinal: 0 });
  const [queue, setQueue] = useState([]);
  useEffect(() => {
    if (!data?.events) return;
    const events = [...data.events].sort((a, b) => a.ordinal - b.ordinal);
    const latest = events.at(-1)?.ordinal || 0;
    if (observed.current.room !== roomId) {
      // Joining a room must not replay its old payouts as new winnings.
      observed.current = { room: roomId, ordinal: latest };
      setQueue([]);
      return;
    }
    const fresh = events.filter(event => event.ordinal > observed.current.ordinal);
    if (!fresh.length) return;
    observed.current.ordinal = latest;
    setQueue(previous => [...previous, ...fresh]);
  }, [roomId, data]);
  const first = observed.current.room === roomId ? queue[0] : null;
  const active = first ? data?.events?.find(event => event.id === first.id) || first : null;
  return { active, complete: () => setQueue(previous => previous.slice(1)) };
}