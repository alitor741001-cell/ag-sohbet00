import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Loader2, Trophy, UserCheck, UserPlus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import formatCoinAmount from '@/components/voice/formatCoinAmount';

/**
 * PK ekranının üst şeridi: yayını açan kişinin kartı, takip düğmesi,
 * odadaki kişilerin avatarları ve sohbeti toplama / ekranı kapatma düğmeleri.
 */
export default function PkLiveHeader({ host, user, people = [], galleryIndex = 1, galleryTotal = 1, chatOpen, onToggleChat, onOpenRanking, onClose }) {
  const hostId = host?.id;
  const mine = !!hostId && hostId === user?.id;
  const [social, setSocial] = useState({ following: false, followers: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hostId || mine) return undefined;
    let alive = true;
    base44.functions.invoke('social-service', { action: 'state', user_id: hostId })
      .then((response) => {
        if (!alive) return;
        setSocial({ following: !!response.data?.following, followers: response.data?.followers || 0 });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [hostId, mine]);

  const toggleFollow = async () => {
    if (!hostId || busy) return;
    setBusy(true);
    try {
      const response = await base44.functions.invoke('social-service', {
        action: social.following ? 'unfollow' : 'follow',
        user_id: hostId,
      });
      const following = !!response.data?.following;
      setSocial((current) => ({ following, followers: Math.max(0, current.followers + (following ? 1 : -1)) }));
    } catch (error) {
      // Takip edilemedi: düğme olduğu gibi kalır, ekran çalışmaya devam eder.
    } finally {
      setBusy(false);
    }
  };

  const stack = people.slice(0, 3);

  return (
    <header className="shrink-0 px-2 pb-1 pt-1.5">
      <div className="flex items-center gap-1.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 ring-2 ring-[#fe2c55]">
          {host?.avatar ? <img src={host.avatar} alt="" className="h-full w-full object-cover" /> : null}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-black leading-tight text-white">{host?.name || 'Yayıncı'}</p>
          <p className="flex items-center gap-0.5 text-[9.5px] font-bold tabular-nums text-white/70">
            <Heart className="h-2.5 w-2.5 fill-[#fe2c55] text-[#fe2c55]" /> {formatCoinAmount(social.followers)}
          </p>
        </div>

        {!mine && (
          <button
            type="button"
            onClick={toggleFollow}
            disabled={busy}
            className="ml-0.5 flex h-6 shrink-0 items-center gap-0.5 rounded-full bg-[#fe2c55] px-2 text-[10px] font-black text-white active:scale-95 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : social.following ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
            {social.following ? 'Takip' : 'Takip et'}
          </button>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <span className="flex items-center">
            {stack.map((person, index) => (
              <span
                key={person.user_id || index}
                className="-ml-1.5 flex h-6 w-6 overflow-hidden rounded-full bg-white/20 ring-2 ring-black first:ml-0"
              >
                {person.avatar ? <img src={person.avatar} alt="" className="h-full w-full object-cover" /> : null}
              </span>
            ))}
            {Math.max(0, people.length - stack.length) > 0 && (
              <span className="-ml-1.5 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white/20 px-1 text-[9px] font-black text-white ring-2 ring-black">
                +{people.length - stack.length}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={onToggleChat}
            aria-label={chatOpen ? 'Sohbeti topla' : 'Sohbeti aç'}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white/85 active:scale-95"
          >
            {chatOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white/85 active:scale-95"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenRanking}
          className="flex items-center gap-0.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9.5px] font-black text-amber-200 active:scale-95"
        >
          <Trophy className="h-2.5 w-2.5" /> Saatlik Sıralama
        </button>
        <span className="ml-auto rounded-md bg-white/12 px-1.5 py-0.5 text-[9.5px] font-black tabular-nums text-white/80">
          Galeri {galleryIndex}/{galleryTotal}
        </span>
      </div>
    </header>
  );
}