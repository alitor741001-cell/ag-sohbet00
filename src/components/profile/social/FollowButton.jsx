import { useEffect, useState } from 'react';
import { Loader2, UserCheck, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import CompactActionTile from '@/components/profile/compact/CompactActionTile';

/** Takip Et / Takipten Çık: sayaçla birlikte, profil açılan her yerde aynı görünür.
 *  variant="tile" kompakt profil kartının alt işlem şeridinde küçük kare düğme olarak gösterir. */
export default function FollowButton({ userId, accent = '#6fe6dc', variant = 'full', tone = 'pink', onChange }) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [state, setState] = useState({ following: false, followers: 0 });
  const [busy, setBusy] = useState(false);
  const visible = !!userId && userId !== user?.id;

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    base44.functions.invoke('social-service', { action: 'state', user_id: userId })
      .then((response) => { if (alive) setState({ following: !!response.data?.following, followers: response.data?.followers || 0 }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [visible, userId]);

  if (!visible) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await base44.functions.invoke('social-service', {
        action: state.following ? 'unfollow' : 'follow',
        user_id: userId,
      });
      const following = !!response.data?.following;
      setState((current) => ({
        following,
        followers: Math.max(0, current.followers + (following ? 1 : -1)),
      }));
      onChange?.();
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'tile') {
    return (
      <CompactActionTile
        icon={state.following ? UserCheck : UserPlus}
        label={state.following ? 'Takip Ediliyor' : 'Takip Et'}
        active={state.following}
        loading={busy}
        tone={tone}
        onClick={toggle}
      />
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        style={{
          borderColor: accent,
          background: state.following ? 'rgba(0,0,0,0.45)' : 'rgba(111,230,220,0.14)',
          boxShadow: `0 0 20px -8px ${accent}`,
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : state.following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        {state.following ? 'Takipten Çık' : 'Takip Et'}
      </button>
      <span className="shrink-0 rounded-2xl border border-white/15 px-3 py-3 text-[11px] font-bold text-white/70">
        {state.followers} takipçi
      </span>
    </div>
  );
}