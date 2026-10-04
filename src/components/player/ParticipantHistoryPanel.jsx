import { History, UsersRound, Crown } from 'lucide-react';
import ProfileFrame from '@/components/ProfileFrame';
import XpAvatar from '@/components/xp/XpAvatar';
import RoomLevelBadge from '@/components/levels/RoomLevelBadge';
import { isHiddenName } from '@/lib/hiddenUser';

const ago = (value) => {
  if (!value) return 'yakın zamanda katıldı';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Az önce katıldı';
  if (minutes < 60) return `${minutes} dakika önce katıldı`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} saat önce katıldı`;
  return `${Math.floor(minutes / 1440)} gün önce katıldı`;
};

/** Tek izleyici satırı: normal boyutta profil, isim ve seviye rozeti. */
function Person({ person, profile, ownerId, status, level, onSelect }) {
  const avatar = person.avatar || profile?.avatar;
  // Gizli kullanıcı: yalnızca kırmızı takma ad görünür, profili açılmaz.
  const hidden = isHiddenName(person.name);
  return <button onClick={() => { if (!hidden) onSelect?.(person.user_id); }} className={`flex w-full min-w-0 items-center gap-1.5 rounded-lg px-1 py-1 text-left ${hidden ? 'cursor-default' : 'hover:bg-white/5'}`}><span className="relative shrink-0">{!hidden && profile?.profile_frame ? <ProfileFrame frame={profile.profile_frame} avatar={avatar} name={person.name} size="2xs" /> : <XpAvatar avatar={avatar} name={person.name} userId={hidden ? '' : person.user_id} size="2xs" />}<span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-black ${status === 'online' ? 'bg-green-400' : 'bg-red-500'}`} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-white">{hidden ? <span className="hidden-user-name">{person.name}</span> : person.name}{!hidden && person.user_id === ownerId && <Crown className="ml-1 inline h-3 w-3 text-amber-400" />}</span><span className="block truncate text-[9px] text-[#888]">{status === 'recent' ? ago(person.joined_at || person.left_at) : status === 'online' ? 'çevrim içi' : 'çevrim dışı'}</span></span>{!hidden && <RoomLevelBadge level={level} compact />}</button>;
}

export default function ParticipantHistoryPanel({ participants, recentParticipants, profiles, presenceMap, roomLevels = {}, ownerId, onSelect }) {
  const recent = [...participants, ...recentParticipants].filter((p, i, all) => all.findIndex((item) => item.user_id === p.user_id) === i).sort((a, b) => new Date(b.joined_at || b.left_at || 0) - new Date(a.joined_at || a.left_at || 0));
  const columns = [{ title: `İzleyiciler (${participants.length})`, subtitle: 'Odada bulunan tüm izleyiciler', icon: UsersRound, items: participants, recent: false }, { title: 'Son Katılanlar', subtitle: 'Odaya son katılan izleyiciler', icon: History, items: recent, recent: true }];
  return <div className="grid h-full min-h-0 grid-cols-2 gap-2 bg-black p-2">{columns.map(({ title, subtitle, icon: Icon, items, recent: isRecent }) => <section key={title} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d]"><header className="flex shrink-0 items-start gap-2 border-b border-white/5 p-2"><span className="rounded-lg bg-amber-400/10 p-1.5"><Icon className="h-4 w-4 text-amber-400" /></span><span className="min-w-0"><strong className="block truncate text-xs text-white">{title}</strong><span className="block truncate text-[9px] text-[#888]">{subtitle}</span></span></header><div className="min-h-0 flex-1 overflow-y-auto p-1">{items.length ? items.map((person) => { const presence = presenceMap[person.user_id]; const online = presence?.online && Date.now() - new Date(presence.last_seen || 0).getTime() < 60000; return <Person key={person.user_id} person={person} profile={profiles[person.user_id]} ownerId={ownerId} status={isRecent ? 'recent' : online ? 'online' : 'offline'} level={roomLevels[person.user_id]} onSelect={onSelect} />; }) : <p className="px-2 py-8 text-center text-[10px] text-[#666]">Henüz kimse yok</p>}</div></section>)}</div>;
}