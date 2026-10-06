import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import RoomWelcomeVisual from '@/components/player/RoomWelcomeVisual';

const VISUAL_BY_ROLE = {
  founder: 'admin',
  queen_admin: 'queenAdmin',
  admin_helper: 'admin',
  can_ablam: 'canAblam',
  can_abim: 'canAbim',
  gul: 'gul',
};

export default function SpecialRoleWelcome({ roomId }) {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const processed = useRef(new Set());
  const processMessage = useCallback((message) => {
    if (!message || message.room_id !== roomId || message.type !== 'system' || processed.current.has(message.id) || !(message.text || '').includes('odaya katıldı')) return;
    const roleKey = (message.text || '').match(/\{\{ROLE\|([^|}]+)/)?.[1];
    const type = VISUAL_BY_ROLE[roleKey];
    if (!type) return;
    processed.current.add(message.id);
    setQueue((items) => [...items.slice(-5), { id: message.id, type }]);
  }, [roomId]);
  useEffect(() => {
    base44.entities.RoomMessage.filter({ room_id: roomId, type: 'system' }, '-created_date', 12)
      .then((items) => items.filter((item) => Date.now() - new Date(item.created_date).getTime() < 15000).reverse().forEach(processMessage)).catch(() => {});
    const off = subscribeEntity('RoomMessage', (event) => event.type === 'create' && processMessage(event.data));
    return off;
  }, [roomId, processMessage]);
  useEffect(() => {
    if (!current && queue.length) { setCurrent(queue[0]); setQueue((items) => items.slice(1)); }
  }, [current, queue]);
  const finishCurrent = useCallback(() => setCurrent(null), []);
  return current ? <RoomWelcomeVisual key={current.id} type={current.type} onDone={finishCurrent} /> : null;
}