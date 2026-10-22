import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
export default function useSeatCosmetics(seats = []) {
  const signature = [...new Set(seats.map(s => s?.user_id).filter(Boolean))].sort().join('|');
  const [choices, setChoices] = useState({});
  useEffect(() => {
    let alive = true; const ids = signature.split('|').filter(Boolean);
    setChoices({}); if (!ids.length) return;
    const versions = new Map(); let tick = 0;
    const off = subscribeEntity('CosmeticSelection', ev => {
      const id = ev.data?.owner_id;
      if (!ids.includes(id)) return;
      versions.set(id, ++tick);
      setChoices(old => ({ ...old, [id]: ev.type === 'delete' ? null : ev.data }));
    });
    const atStart = tick;
    base44.entities.CosmeticSelection.filter({ owner_id: { $in: ids } }, { limit: 100 }).then(page => {
      if (alive) setChoices(old => ({ ...old, ...Object.fromEntries(page.items.filter(row => (versions.get(row.owner_id) || 0) <= atStart).map(row => [row.owner_id,row])) }));
    });
    return () => { alive = false; off(); };
  }, [signature]);
  return choices;
}