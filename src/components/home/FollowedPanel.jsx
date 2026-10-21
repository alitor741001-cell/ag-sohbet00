import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import RoomDiscoveryCard from '@/components/home/RoomDiscoveryCard';

const isVoiceRoom = (room) => room?.room_type === 'voice' || room?.voice_mode === true;
const hasPeopleInside = (room) => (room?.participants || []).some((person) => person?.user_id);

/** Arkadaşlar / Takip Ediliyor: seçilen grubun şu an yayında olan odaları. */
export default function FollowedPanel({ mode = 'following', rooms = [], owners = {}, friends = [], filmTitleFor }) {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(mode === 'following');

  useEffect(() => {
    if (mode !== 'following') {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    setLoading(true);
    base44.functions
      .invoke('social-service', { action: 'list', kind: 'following' })
      .then((res) => { if (alive) setFollowing(res.data?.items || []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [mode]);

  const isFriends = mode === 'friends';
  const groupIds = new Set(isFriends ? friends.map((friend) => friend.id) : following.map((person) => person.id));
  const groupSize = isFriends ? friends.length : following.length;
  const streams = rooms.filter((room) => groupIds.has(room.owner_id) && hasPeopleInside(room));
  const title = isFriends ? 'ARKADAŞLARININ YAYINLARI' : 'TAKİP ETTİKLERİNİN YAYINLARI';

  return (
    <div>
      <div className="mb-2 mt-1 flex items-center gap-2">
        <span className="h-3 w-1 rounded-full" style={{ background: 'linear-gradient(180deg,#ffe6a8,#7ff0e6)' }} />
        <h2 className="text-[10.5px] font-black tracking-[0.18em] text-[#ffe6a8]">{title}</h2>
        <span className="ml-auto text-[10px] font-bold text-white/40">{streams.length}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-[16px] bg-[#10141d]" style={{ aspectRatio: '3 / 2' }} />
          ))}
        </div>
      ) : groupSize === 0 ? (
        <div className="premium-panel rounded-2xl px-4 py-8 text-center">
          {isFriends ? <Users className="mx-auto mb-2 h-6 w-6 text-premium-gold/70" /> : <Radio className="mx-auto mb-2 h-6 w-6 text-premium-gold/70" />}
          <p className="text-sm font-bold text-white">{isFriends ? 'Henüz arkadaşın yok.' : 'Henüz kimseyi takip etmiyorsun.'}</p>
          <p className="mt-1 text-[11px] font-semibold text-white/45">
            {isFriends ? 'Arkadaş eklediğinde yayınları burada listelenir.' : 'Takip ettiğin kişiler yayına başladığında burada görünür.'}
          </p>
          {isFriends && (
            <Link to="/arkadaslar" className="mt-2 inline-block rounded-lg border border-premium-gold/50 px-3 py-1.5 text-xs font-black text-premium-gold">
              Arkadaş ekle →
            </Link>
          )}
        </div>
      ) : streams.length === 0 ? (
        <div className="premium-panel rounded-2xl px-4 py-8 text-center">
          <p className="text-sm font-bold text-white">
            {isFriends ? 'Arkadaşların şu an yayında değil.' : 'Takip ettiklerin şu an yayında değil.'}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-white/45">Yayına başladıklarında odaları burada listelenir.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {streams.map((room, index) => {
            const kind = isVoiceRoom(room) ? 'voice' : 'film';
            return (
              <RoomDiscoveryCard
                key={room.id}
                room={room}
                owner={owners[room.owner_id]}
                kind={kind}
                filmTitle={kind === 'film' ? filmTitleFor?.(room) || '' : ''}
                friendInside={isFriends}
                rank={index < 3 ? index + 1 : 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}