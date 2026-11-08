import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, Loader2, Video, X } from 'lucide-react';
import { RoomEvent } from 'livekit-client';
import useFriends from '@/hooks/useFriends';

const Row = ({ person, label, onPick, disabled, busy }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onPick?.(person)}
    className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left active:scale-[0.99] disabled:opacity-50"
  >
    {person.avatar
      ? <img src={person.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
      : <span className="h-8 w-8 rounded-full bg-white/15" />}
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[12px] font-bold text-white">{person.name || 'Kullanıcı'}</span>
      {label && <span className="block truncate text-[9.5px] font-semibold text-white/45">{label}</span>}
    </span>
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-fuchsia-500 px-2.5 py-1 text-[10px] font-black text-white">
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Video className="h-3 w-3" />} Davet
    </span>
  </button>
);

/**
 * PK davet ekranı: yayında olanlara ve arkadaşlara davet gönderilir.
 * Davet edilen taraf kabul edince "Başla" ile 5 dakikalık tur başlar.
 */
export default function PkInvitePanel({ mode, match, user, participants = [], livekitRoom, onInvite, onStart, onCancel, onAccept, onDecline, busy }) {
  const [tab, setTab] = useState('live');
  const [cams, setCams] = useState([]);
  const { relations } = useFriends();

  // Görüntülü yayın yapanlar: kamerası açık olan oda katılımcıları.
  useEffect(() => {
    const room = livekitRoom;
    if (!room) { setCams([]); return undefined; }
    const scan = () => {
      const ids = [];
      room.remoteParticipants?.forEach((participant) => {
        const onCamera = participant.trackPublications
          ? [...participant.trackPublications.values()].some((pub) => pub.source === 'camera' && pub.track)
          : false;
        if (onCamera) ids.push(participant.identity);
      });
      setCams(ids);
    };
    scan();
    room.on?.(RoomEvent.TrackSubscribed, scan);
    room.on?.(RoomEvent.TrackUnsubscribed, scan);
    room.on?.(RoomEvent.LocalTrackPublished, scan);
    return () => {
      room.off?.(RoomEvent.TrackSubscribed, scan);
      room.off?.(RoomEvent.TrackUnsubscribed, scan);
      room.off?.(RoomEvent.LocalTrackPublished, scan);
    };
  }, [livekitRoom]);

  const broadcasters = useMemo(
    () => participants
      .filter((person) => person?.user_id && person.user_id !== user?.id && cams.includes(person.user_id))
      .map((person) => ({ user_id: person.user_id, name: person.name, avatar: person.avatar })),
    [participants, cams, user?.id],
  );

  const friends = useMemo(() => relations
    .filter((relation) => relation.status === 'accepted')
    .map((relation) => {
      const mine = relation.requester_id === user?.id;
      return mine
        ? { user_id: relation.recipient_id, name: relation.recipient_name, avatar: relation.recipient_avatar }
        : { user_id: relation.requester_id, name: relation.requester_name, avatar: relation.requester_avatar };
    })
    .filter((person) => person.user_id && person.user_id !== user?.id), [relations, user?.id]);

  // Davet gönderildi: karşı tarafın kabulü ve "Başla" beklenir.
  if (mode === 'waiting') {
    const guestName = match?.guest_name || 'Rakip';
    return (
      <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-3">
        <div className="flex items-center gap-2">
          {match?.guest_avatar
            ? <img src={match.guest_avatar} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-fuchsia-400/60" />
            : <span className="h-12 w-12 rounded-full bg-white/15" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-black text-white">{guestName}</p>
            <p className="flex items-center gap-1 text-[10.5px] font-semibold text-white/55">
              {match?.accepted
                ? <><Check className="h-3 w-3 text-emerald-400" /> Kabul etti — başlatabilirsin</>
                : <><Clock3 className="h-3 w-3" /> Davet gönderildi, kabul bekleniyor</>}
            </p>
          </div>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <button
            type="button"
            disabled={!match?.accepted || busy}
            onClick={onStart}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-[12px] font-black text-black active:scale-95 disabled:opacity-40"
          >
            <Video className="h-4 w-4" /> Başla (5 dk)
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 items-center justify-center gap-1 rounded-xl bg-white/10 px-3 text-[12px] font-bold text-white/80 active:scale-95"
          >
            <X className="h-4 w-4" /> İptal
          </button>
        </div>
      </div>
    );
  }

  // Davet alındı: kabul edilirse iki taraf da PK ekranında buluşur.
  if (mode === 'incoming') {
    const hostName = match?.host_name || 'Rakip';
    const rematch = Number(match?.round_no) > 1;
    return (
      <div className="rounded-2xl border border-fuchsia-300/40 bg-fuchsia-500/10 p-3">
        <div className="flex items-center gap-2">
          {match?.host_avatar
            ? <img src={match.host_avatar} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-fuchsia-400/70" />
            : <span className="h-12 w-12 rounded-full bg-white/15" />}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-black text-white">{hostName}</p>
            <p className="text-[10.5px] font-semibold text-white/60">{rematch ? 'Rövanş istiyor' : 'Seni görüntülü PK’ya davet etti'}</p>
          </div>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          {match?.accepted ? (
            <p className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 text-[11.5px] font-black text-emerald-300">
              <Check className="h-4 w-4" /> Kabul edildi — başlatılması bekleniyor
            </p>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onAccept}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-[12px] font-black text-black active:scale-95 disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Kabul et
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onDecline}
                className="flex h-10 items-center justify-center gap-1 rounded-xl bg-white/10 px-3 text-[12px] font-bold text-white/80 active:scale-95"
              >
                <X className="h-4 w-4" /> Reddet
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Henüz PK yok: yayındakiler ve arkadaşlar listelenir.
  const list = tab === 'live' ? broadcasters : friends;
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/12 bg-white/[0.05]">
      <div className="flex shrink-0 gap-1 p-1.5">
        <button
          type="button"
          onClick={() => setTab('live')}
          className={`flex-1 rounded-lg py-1.5 text-[11px] font-black active:scale-95 ${tab === 'live' ? 'bg-fuchsia-500 text-white' : 'bg-white/10 text-white/60'}`}
        >
          Yayındakiler ({broadcasters.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('friends')}
          className={`flex-1 rounded-lg py-1.5 text-[11px] font-black active:scale-95 ${tab === 'friends' ? 'bg-fuchsia-500 text-white' : 'bg-white/10 text-white/60'}`}
        >
          Arkadaşlar ({friends.length})
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1">
        {list.length === 0 && (
          <p className="px-2 py-6 text-center text-[11px] leading-relaxed text-white/40">
            {tab === 'live'
              ? 'Şu an görüntülü yayın yapan kimse yok. Arkadaşlar sekmesinden davet gönderebilirsin.'
              : 'Arkadaş listende davet gönderebileceğin kimse yok.'}
          </p>
        )}
        {list.map((person) => (
          <Row
            key={person.user_id}
            person={person}
            label={tab === 'live' ? 'Görüntülü yayında' : 'Arkadaşın'}
            disabled={busy}
            onPick={(target) => onInvite?.(target)}
          />
        ))}
      </div>

      <p className="shrink-0 border-t border-white/10 px-2 py-1.5 text-[9.5px] font-semibold text-white/40">
        Davet gönderdiğin kişi kabul edince “Başla” ile 5 dakikalık PK başlar.
      </p>
    </div>
  );
}