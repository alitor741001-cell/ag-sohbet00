import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import RoomDiscoveryCard from '@/components/home/RoomDiscoveryCard';

const isVoiceRoom = (room) => room?.room_type === 'voice' || room?.voice_mode === true;
const hasPeopleInside = (room) => (room?.participants || []).some((person) => person?.user_id);

function SectionTitle({ children, count }) {
  return (
    <div className="mb-2 mt-1 flex items-center gap-2">
      <span className="h-3 w-1 rounded-full" style={{ background: 'linear-gradient(180deg,#ffe6a8,#7ff0e6)' }} />
      <h2 className="text-[10.5px] font-black tracking-[0.18em] text-[#ffe6a8]">{children}</h2>
      {typeof count === 'number' && <span className="ml-auto text-[10px] font-bold text-white/40">{count}</span>}
    </div>
  );
}

function PersonRow({ person, room }) {
  const to = room ? (isVoiceRoom(room) ? `/sesli-oda/${room.id}` : `/oda/${room.id}`) : `/kullanici/${person.id}`;
  const live = Boolean(room);
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-[14px] border border-[#e8c47c]/25 bg-[#071736]/70 px-2.5 py-2 transition active:scale-[0.99]"
    >
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#e8c47c]/50 bg-[#0b2144]">
        {person.avatar ? (
          <Image src={person.avatar} className="h-full w-full" fittingType="fill" alt="" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[12px] font-black text-[#ffe6a8]">
            {(person.name || '?')[0]}
          </span>
        )}
        {live && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#071736] bg-[#ef5350]" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-extrabold text-white">{person.name || 'Kullanıcı'}</span>
        <span className={`block truncate text-[10px] font-semibold ${live ? 'text-[#7ff0e6]' : 'text-white/45'}`}>
          {live ? `Yayında · ${room.name}` : 'Şu an yayında değil'}
        </span>
      </span>
      {live && (
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/25 bg-gradient-to-r from-[#c62828] to-[#ef5350] px-1.5 py-0.5 text-[8.5px] font-black text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> CANLI
        </span>
      )}
    </Link>
  );
}

/** Takip Ediliyor: takip edilen kişilerin canlı yayınları ve arkadaş listesi. */
export default function FollowedPanel({ rooms = [], owners = {}, friends = [], filmTitleFor }) {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    base44.functions
      .invoke('social-service', { action: 'list', kind: 'following' })
      .then((res) => { if (alive) setFollowing(res.data?.items || []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const followingIds = new Set(following.map((person) => person.id));
  const friendIds = new Set(friends.map((friend) => friend.id));
  const roomOf = (id) => rooms.find((room) => room.owner_id === id && hasPeopleInside(room)) || null;

  // Takip edilenlerin canlı yayınları; arkadaş olanlar ayrı bölümde listelenir.
  const streams = rooms.filter((room) => followingIds.has(room.owner_id) && hasPeopleInside(room));
  const friendRows = friends.map((friend) => ({ person: friend, room: roomOf(friend.id) }));

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle count={streams.length}>TAKİP ETTİKLERİNİN YAYINLARI</SectionTitle>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-[16px] bg-[#10141d]" style={{ aspectRatio: '4 / 5' }} />
            ))}
          </div>
        ) : following.length === 0 ? (
          <div className="premium-panel rounded-2xl px-4 py-8 text-center">
            <Radio className="mx-auto mb-2 h-6 w-6 text-premium-gold/70" />
            <p className="text-sm font-bold text-white">Henüz kimseyi takip etmiyorsun.</p>
            <p className="mt-1 text-[11px] font-semibold text-white/45">Takip ettiğin kişiler yayına başladığında burada görünür.</p>
          </div>
        ) : streams.length === 0 ? (
          <div className="premium-panel rounded-2xl px-4 py-8 text-center">
            <p className="text-sm font-bold text-white">Takip ettiklerin şu an yayında değil.</p>
            <p className="mt-1 text-[11px] font-semibold text-white/45">Yayına başladıklarında odaları burada listelenir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {streams.map((room, index) => {
              const kind = isVoiceRoom(room) ? 'voice' : 'film';
              return (
                <RoomDiscoveryCard
                  key={room.id}
                  room={room}
                  owner={owners[room.owner_id]}
                  kind={kind}
                  filmTitle={kind === 'film' ? filmTitleFor?.(room) || '' : ''}
                  friendInside={friendIds.has(room.owner_id)}
                  rank={index < 3 ? index + 1 : 0}
                />
              );
            })}
          </div>
        )}
      </div>

      <div>
        <SectionTitle count={friendRows.length}>ARKADAŞLARIN</SectionTitle>
        {friendRows.length === 0 ? (
          <div className="premium-panel rounded-2xl px-4 py-8 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-premium-gold/70" />
            <p className="text-sm font-bold text-white">Henüz arkadaşın yok.</p>
            <Link to="/arkadaslar" className="mt-2 inline-block rounded-lg border border-premium-gold/50 px-3 py-1.5 text-xs font-black text-premium-gold">
              Arkadaş ekle →
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {friendRows.map(({ person, room }) => (
              <PersonRow key={person.id} person={person} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}