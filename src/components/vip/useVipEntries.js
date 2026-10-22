import { useEffect, useRef, useState } from 'react';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { isHiddenName } from '@/lib/hiddenUser';
import { vipLook } from '@/components/vip/vipTheme';
export default function useVipEntries(roomId, participants = []) {
  const known = useRef(new Set());
  const [queue, setQueue] = useState([]);
  const mountedAt = useRef(Date.now());
  useEffect(() => { known.current = new Set(); setQueue([]); mountedAt.current = Date.now(); }, [roomId]);
  const signature = participants.map((person) => `${person.user_id}:${person.joined_at}`).join('|');
  useEffect(() => {
    const arrivals = [];
    for (const person of participants) {
      const stamp = Date.parse(person.joined_at || '');
      const key = `${person.user_id}:${person.joined_at}`;
      if (!person.user_id || known.current.has(key)) continue;
      known.current.add(key);
      if (isHiddenName(person.name) || !Number.isFinite(stamp) || stamp < mountedAt.current - 5000 || Date.now() - stamp > 15000) continue;
      arrivals.push({ ...person, entryKey: key });
    }
    if (arrivals.length) setQueue((previous) => [...previous, ...arrivals].slice(-5));
  }, [roomId, signature]);
  const profiles = useMessageProfiles(queue.map((person) => person.user_id));
  const first = queue[0];
  const profile = profiles[first?.user_id];
  const theme = vipLook(profile, 'banner');
  const dismiss = () => setQueue((previous) => previous.slice(1));
  useEffect(() => {
    if (!first) return;
    const timer = setTimeout(() => setQueue((previous) => previous[0]?.entryKey === first.entryKey ? previous.slice(1) : previous), profile ? theme ? 3500 : 0 : 7000);
    return () => clearTimeout(timer);
  }, [first?.entryKey, profile, theme]);
  return { person: first, profile, theme, dismiss };
}