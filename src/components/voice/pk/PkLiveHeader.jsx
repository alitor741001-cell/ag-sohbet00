import { useEffect, useState } from 'react';
import { Heart, Loader2, Trophy, UserCheck, UserPlus, Users, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import formatCoinAmount from '@/components/voice/formatCoinAmount';

/**
 * PK ekranının üst şeridi: karşı tarafın kartı ve takip düğmesi,
 * sağ üstte katılanları açan düğme ve yayından ayrılma (X) düğmesi.
 */
export default function PkLiveHeader({
  person, user, viewerCount = 0, onOpenViewers, onOpenRanking, onClose, galleryIndex = 1, galleryTotal = 1,
}) {
  const personId = person?.id;
  const mine = !personId || personId === user?.id;
  const [social, setSocial] = useState({ following: false, followers: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSocial({ following: false, followers: 0 });
    if (!personId || mine) return undefined;
    let alive = true;
    base44.functions.invoke('social-service', { action: 'state', user_id: personId })
      .then((response) => {
        if (!alive) return;
        setSocial({ following: !!response.data?.following, followers: response.data?.followers || 0 });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [personId, mine]);

  const toggleFollow = async () => {
    if (!personId || busy) return;
    setBusy(true);
    try {
      const response = await base44.functions.invoke('social-service', {
        action: social.following ? 'unfollow' : 'follow',
        user_id: personId,
      });
      const following = !!response.data?.following;
      setSocial((current) => ({ following, followers: Math.max(0, current.followers + (following ? 1 : -1)) }));
    } catch (error) {
      // Takip edilemedi: düğme olduğu gibi kalır, ekran çalışmaya devam eder.
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="shrink-0 px-2 pb-1 pt-1.5">
      <div className="flex items-center gap-1.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 ring-2 ring-[#fe2c55]">
          {person?.avatar ? <img src={person.avatar} alt="" className="h-full w-full object-cover" /> : null}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-black leading-tight text-white">{person?.name || 'Yayıncı'}</p>
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
          <button
            type="button"
            onClick={onOpenViewers}
            aria-label="Katılanları gör"
            className="flex h-6 items-center gap-0.5 rounded-full bg-black/45 px-1.5 text-[10px] font-black tabular-nums text-white active:scale-95"
          >
            <Users className="h-3.5 w-3.5" /> {viewerCount}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yayından ayrıl"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fe2c55] text-white active:scale-95"
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