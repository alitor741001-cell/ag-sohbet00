import { useEffect, useRef, useState } from 'react';
import { Image } from '@/components/ui/image';
import { getRoleInfo } from '@/lib/roles';

const NAME_EFFECT_COLORS = {
  flame: '#ff4500',
  lightning: '#3b82f6',
  heart: '#ec4899',
  diamond: '#ff1744',
  star: '#facc15',
  gold: '#fbbf24',
  smoke: '#4caf50',
  solid: '#ffffff',
};

export default function RoomCheatPanel({ participants, currentUserId, profiles = {} }) {
  const [notifications, setNotifications] = useState([]);
  const prevRef = useRef([]);
  const initializedRef = useRef(false);
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;

  useEffect(() => {
    const list = participants || [];
    const prev = prevRef.current;
    const prevIds = new Set(prev.map((p) => p.user_id));
    const currIds = new Set(list.map((p) => p.user_id));

    if (initializedRef.current) {
      const joined = list.filter((p) => !prevIds.has(p.user_id) && p.user_id !== currentUserId);
      const left = prev.filter((p) => !currIds.has(p.user_id) && p.user_id !== currentUserId);
      joined.forEach((participant) => setTimeout(() => addNotif(participant, 'join'), 1200));
      left.forEach((participant) => setTimeout(() => addNotif(participant, 'leave'), 1200));
    }

    prevRef.current = list;
    initializedRef.current = true;
  }, [participants, currentUserId]);

  const addNotif = (participant, type) => {
    const id = Date.now() + '-' + Math.random().toString(36).slice(2);
    setNotifications((current) => [...current, { id, participant, type, exiting: false }]);
    setTimeout(() => setNotifications((current) => current.map((n) => (n.id === id ? { ...n, exiting: true } : n))), 3500);
    setTimeout(() => setNotifications((current) => current.filter((n) => n.id !== id)), 4000);
  };

  if (!notifications.length) return null;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[56] flex flex-col items-center gap-1.5 pointer-events-none w-max max-w-[90%]">
      {notifications.map((n) => {
        const profile = profilesRef.current[n.participant.user_id] || {};
        const roleInfo = getRoleInfo(profile);
        const borderColor = roleInfo.color || '#ff1744';
        const nameColor = NAME_EFFECT_COLORS[profile.name_effect] || roleInfo.color || '#ffffff';
        const avatar = n.participant.avatar || profile.avatar;
        const name = profile.title || n.participant.name || 'Kullanıcı';
        return (
          <div key={n.id} className={`flex min-w-56 items-center gap-2 rounded-2xl border bg-black/95 px-3 py-2 shadow-2xl backdrop-blur-xl ${n.exiting ? (n.type === 'join' ? 'room-notif-out-left' : 'room-notif-out-right') : 'room-notif-in'}`} style={{ borderColor, boxShadow: `0 0 22px ${borderColor}66, inset 0 0 16px ${borderColor}22` }}>
            {avatar ? <Image src={avatar} className="h-9 w-9 shrink-0 rounded-full border" style={{ borderColor }} fittingType="fill" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-black text-sm font-black" style={{ borderColor, color: borderColor }}>{name[0]}</span>}
            <span className="min-w-0 flex-1 text-center leading-tight">
              <span className="block truncate text-xs font-bold" style={{ color: nameColor }}>{name}</span>
              <small className="block text-[10px] font-semibold opacity-70" style={{ color: nameColor }}>{n.type === 'join' ? 'odaya katıldı' : 'odadan ayrıldı'}</small>
            </span>
          </div>
        );
      })}
    </div>
  );
}