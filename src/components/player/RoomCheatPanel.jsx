import { useEffect, useRef, useState } from 'react';
import RoomCheatNotice from '@/components/player/RoomCheatNotice';

export default function RoomCheatPanel({ participants = [], visible, profiles = {} }) {
  const [notifications, setNotifications] = useState([]);
  const previous = useRef(null);
  const profileCache = useRef({});
  profileCache.current = { ...profileCache.current, ...profiles };

  useEffect(() => {
    const prev = previous.current;
    previous.current = participants;
    if (!prev) return;
    const oldIds = new Set(prev.map((p) => p.user_id));
    const newIds = new Set(participants.map((p) => p.user_id));
    const changes = [
      ...participants.filter((p) => !oldIds.has(p.user_id)).map((participant) => ({ participant, type: 'join' })),
      ...prev.filter((p) => !newIds.has(p.user_id)).map((participant) => ({ participant, type: 'leave' })),
    ].map((event) => ({ ...event, id: `${event.participant.user_id}-${event.type}-${Date.now()}` }));
    if (changes.length) setNotifications((items) => [...items, ...changes].slice(-10));
  }, [participants]);

  useEffect(() => {
    if (!visible || !notifications.length) return;
    const timer = setTimeout(() => setNotifications([]), 5000);
    return () => clearTimeout(timer);
  }, [visible, notifications]);

  if (!notifications.length) return null;
  return (
    <div aria-live="polite" className="w-full shrink-0 space-y-2 overflow-y-auto border-b border-border bg-card p-2 max-h-[30dvh]">
      {notifications.map((notice) => <RoomCheatNotice key={notice.id} notice={notice} profile={profileCache.current[notice.participant.user_id]} />)}
    </div>
  );
}