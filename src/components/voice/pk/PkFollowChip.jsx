import { useEffect, useState } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/** Rakibin isminin yanındaki küçük Takip Et düğmesi. */
export default function PkFollowChip({ userId }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId) return undefined;
    let alive = true;
    base44.functions.invoke('social-service', { action: 'state', user_id: userId })
      .then((response) => { if (alive) setFollowing(!!response.data?.following); })
      .catch(() => {});
    return () => { alive = false; };
  }, [userId]);

  if (!userId) return null;

  const toggle = async (event) => {
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    const response = await base44.functions.invoke('social-service', {
      action: following ? 'unfollow' : 'follow',
      user_id: userId,
    }).catch(() => null);
    if (response) setFollowing(!!response.data?.following);
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={following ? 'Takipten çık' : 'Takip et'}
      className={`flex h-5 shrink-0 items-center gap-0.5 rounded-full px-1.5 text-[9px] font-black active:scale-95 disabled:opacity-60 ${
        following ? 'bg-white/20 text-white' : 'bg-fuchsia-500 text-white'
      }`}
    >
      {busy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : following ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
      {following ? 'Takipte' : 'Takip Et'}
    </button>
  );
}