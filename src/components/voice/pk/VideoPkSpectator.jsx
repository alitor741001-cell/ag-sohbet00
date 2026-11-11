import { useEffect, useState } from 'react';
import usePkLiveKit from '@/hooks/usePkLiveKit';
import PkFeedTile from '@/components/voice/pk/PkFeedTile';
import PkScoreBar from '@/components/voice/pk/PkScoreBar';

const clock = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/** İzleyici görünümü: odadaki herkes iki kamerayı görür ve iki tarafın sesini duyar. */
export default function VideoPkSpectator({ match, user, onOpenProfile }) {
  const [now, setNow] = useState(Date.now());
  const { remoteTracks, startAudio } = usePkLiveKit({ matchId: match?.id, enabled: !!match?.id, selfId: user?.id, viewer: true });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!match) return null;
  const trackOf = (id) => remoteTracks.find((item) => item.identity === id)?.track || null;
  const endsAt = match.ends_at ? new Date(match.ends_at).getTime() : 0;
  const timerText = match.started && endsAt ? clock(Math.max(0, Math.ceil((endsAt - now) / 1000))) : clock(300);
  const sides = [
    { id: match.host_id, name: match.host_name, avatar: match.host_avatar, score: (Number(match.host_score) || 0) * 1000 },
    { id: match.guest_id, name: match.guest_name, avatar: match.guest_avatar, score: (Number(match.guest_score) || 0) * 1000 },
  ];

  return (
    <div className="shrink-0 px-2 pb-1.5" onClick={startAudio}>
      <PkScoreBar leftScore={sides[0].score} rightScore={sides[1].score} timerText={timerText} />
      <div className="mt-1 flex items-stretch gap-1.5" style={{ height: 'clamp(104px, 24vh, 176px)' }}>
        {sides.map((side, index) => (
          <div key={index} className="relative h-full w-1/2 min-w-0 overflow-hidden rounded-2xl bg-black ring-1 ring-white/12">
            {side.id ? (
              <PkFeedTile
                name={side.name || 'Kullanıcı'}
                avatar={side.avatar}
                score={side.score}
                track={trackOf(side.id)}
                onOpen={() => onOpenProfile?.(side.id)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[11px] font-black text-white/60">Rakip bekleniyor</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}