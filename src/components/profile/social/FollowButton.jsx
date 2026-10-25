import { useEffect, useState } from 'react';
import { Loader2, UserCheck, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import CrystalCircleButton from '@/components/profile/crystal/CrystalCircleButton';

/** Takip Et / Takipten Çık: sayaçla birlikte, profil açılan her yerde aynı görünür.
 *  variant="circle" sesli odadaki kartın yuvarlak düğme şeridinde gösterir. */
export default function FollowButton({ userId, accent = '#6fe6dc', variant = 'full', tone = 'blue', compact = false, onChange }) {
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

  if (variant === 'circle') {
    return (
      <CrystalCircleButton
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
    <div className="flex w-full min-w-0 items-center gap-1.5">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`flex min-w-0 flex-1 items-center justify-center border-2 font-black text-white disabled:opacity-60 ${compact ? 'gap-1 rounded-xl px-2 py-1.5 text-[10px]' : 'gap-2 rounded-2xl px-4 py-3 text-sm'}`}
        style={{
          borderColor: accent,
          background: state.following ? 'rgba(0,0,0,0.45)' : 'rgba(111,230,220,0.14)',
          boxShadow: `0 0 20px -8px ${accent}`,
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : state.following ? <UserCheck className={`shrink-0 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} /> : <UserPlus className={`shrink-0 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />}
        <span className="truncate">{state.following ? 'Takipten Çık' : 'Takip Et'}</span>
      </button>
      <span className={`shrink-0 whitespace-nowrap border border-white/15 font-bold text-white/70 ${compact ? 'rounded-xl px-1.5 py-1.5 text-[9px]' : 'rounded-2xl px-3 py-3 text-[11px]'}`}>
        {state.followers} takipçi
      </span>
    </div>
  );
}