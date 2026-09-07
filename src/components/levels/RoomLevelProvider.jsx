import { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const RoomLevelContext = createContext(null);

export function useRoomLevelContext() {
  const ctx = useContext(RoomLevelContext);
  return ctx || { levels: [], loading: false };
}

export default function RoomLevelProvider({ children }) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.RoomLevel.list('sort_order', 100).then((items) => {
      setLevels(items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
    const unsub = base44.entities.RoomLevel.subscribe(() => {
      base44.entities.RoomLevel.list('sort_order', 100).then(setLevels).catch(() => {});
    });
    return unsub;
  }, []);

  return <RoomLevelContext.Provider value={{ levels, loading }}>{children}</RoomLevelContext.Provider>;
}