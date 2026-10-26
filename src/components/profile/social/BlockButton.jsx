import { useState } from 'react';
import { Ban, Loader2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import useProfileFriendship from '@/hooks/useProfileFriendship';

export default function BlockButton({ userId, accent, onChange }) {
  const { user, setUser } = useCurrentUser();
  const { toast } = useToast();
  const { friendship, loading, error, refresh } = useProfileFriendship(userId);
  const [busy, setBusy] = useState(false);
  const blocked = (user?.blocked_users || []).includes(userId) || (friendship?.blocked_by || []).includes(user?.id);
  if (!userId || !user || userId === user.id) return null;
  const toggle = async event => {
    event.stopPropagation();
    if (busy || loading) return;
    setBusy(true);
    try {
      const current = await base44.auth.me();
      if (friendship && (blocked ? friendship.blocked_by?.includes(current.id) : ['accepted', 'blocked'].includes(friendship.status))) {
        await base44.functions.invoke('friend-service', { action: blocked ? 'unblock' : 'block', friendship_id: friendship.id });
      }
      const ids = current.blocked_users || [];
      await base44.auth.updateMe({ blocked_users: blocked ? ids.filter(id => id !== userId) : [...new Set([...ids, userId])] });
      setUser(previous => ({ ...previous, blocked_users: blocked ? ids.filter(id => id !== userId) : [...new Set([...ids, userId])] }));
      await refresh();
      onChange?.();
      toast({ title: blocked ? 'Engel kaldırıldı' : 'Kullanıcı engellendi' });
    } catch (failure) {
      toast({ title: 'İşlem başarısız', description: failure.response?.data?.error || failure.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };
  const Icon = busy || loading ? Loader2 : blocked ? ShieldCheck : Ban;
  return <button type="button" onClick={toggle} disabled={busy || loading || !!error}
    className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border-2 px-2 py-1.5 text-[10px] font-black text-fantasy-text disabled:opacity-60"
    style={{ borderColor: accent }}>
    <Icon className={`h-3.5 w-3.5 shrink-0 ${busy || loading ? 'animate-spin' : ''}`} />
    <span>{blocked ? 'Engelden Kaldır' : 'Engelle'}</span>
  </button>;
}