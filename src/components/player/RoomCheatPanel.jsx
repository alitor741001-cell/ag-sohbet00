import { useEffect, useRef, useState } from 'react';
import { Image } from '@/components/ui/image';
import { getRoleInfo } from '@/lib/roles';

const CHEAT_ROLES = ['founder', 'queen_admin', 'admin_helper', 'can_ablam', 'can_abim', 'gul'];

function isCheatRole(profile) {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  return CHEAT_ROLES.includes(profile.display_role);
}

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
      joined.forEach((participant) => setTimeout(() => {
        const profile = profilesRef.current[participant.user_id] || {};
        if (isCheatRole(profile)) addNotif(participant, 'join', profile);
      }, 1200));
      left.forEach((participant) => setTimeout(() => {
        const profile = profilesRef.current[participant.user_id] || {};
        if (isCheatRole(profile)) addNotif(participant, 'leave', profile);
      }, 1200));
    }

    prevRef.current = list;
    initializedRef.current = true;
  }, [participants, currentUserId]);

  const addNotif = (participant, type, profile) => {
    const id = Date.now() + '-' + Math.random().toString(36).slice(2);
    setNotifications((current) => [...current, { id, participant, type, profile, exiting: false }]);
    setTimeout(() => setNotifications((current) => current.map((n) => (n.id === id ? { ...n, exiting: true } : n))), 3500);
    setTimeout(() => setNotifications((current) => current.filter((n) => n.id !== id)), 4000);
  };

  if (!notifications.length) return null;

  return (
    <div className="absolute top-[max(env(safe-area-inset-top),3.5rem)] left-1/2 -translate-x-1/2 z-[56] flex flex-col items-center gap-1.5 pointer-events-none w-max max-w-[85%]">
      {notifications.map((n) => {
        const profile = n.profile || {};
        const roleInfo = getRoleInfo(profile);
        const color = roleInfo.color || (n.type === 'join' ? '#22c55e' : '#ef4444');
        const roleLabel = profile.role === 'admin' ? 'ADMİN' : roleInfo.label;
        const avatar = n.participant.avatar || profile.avatar;
        const name = profile.title || n.participant.name || 'Kullanıcı';
        return (
          <div key={n.id} className={`flex min-w-56 items-center gap-2 rounded-2xl border bg-black/95 px-3 py-2 shadow-2xl backdrop-blur-xl ${n.exiting ? (n.type === 'join' ? 'room-notif-out-left' : 'room-notif-out-right') : 'room-notif-in'}`} style={{ borderColor: `${color}cc`, boxShadow: `0 0 22px ${color}66, inset 0 0 16px ${color}22` }}>
            {avatar ? <Image src={avatar} className="h-9 w-9 shrink-0 rounded-full border" style={{ borderColor: color }} fittingType="fill" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-black text-sm font-black" style={{ borderColor: color, color }}>{name[0]}</span>}
            <span className="min-w-0 flex-1 text-center leading-tight">
              <strong className="block truncate text-sm font-black tracking-wide" style={{ color }}>{roleLabel}</strong>
              <span className="block truncate text-xs font-bold text-white">{name}</span>
              <small className="block text-[10px] font-semibold opacity-70 text-white">{n.type === 'join' ? 'odaya katıldı' : 'odadan ayrıldı'}</small>
            </span>
          </div>
        );
      })}
    </div>
  );
}