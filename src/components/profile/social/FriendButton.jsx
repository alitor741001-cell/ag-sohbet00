import { useEffect, useState } from 'react';
import { Check, Loader2, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import subscribeEntity from '@/components/data/entitySubscriptions';

/** Arkadaş Ekle / İstek Gönderildi: Takip Et düğmesiyle aynı görünümde, her profil kartında. */
export default function FriendButton({ userId, accent = '#6fe6dc', compact = true, onChange }) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [relation, setRelation] = useState('');
  const [busy, setBusy] = useState(false);
  const visible = !!userId && userId !== user?.id;

  useEffect(() => {
    if (!visible) return undefined;
    let alive = true;
    const load = () => base44.entities.Friendship.filter({ members: userId }, '-created_date', 50)
      .then((rows) => {
        if (!alive) return;
        const found = (rows || []).find((row) => (row.members || []).includes(user?.id));
        setRelation(found?.status === 'accepted' ? 'friend' : found?.status === 'pending' ? 'pending' : '');
      })
      .catch(() => {});
    load();
    const off = subscribeEntity('Friendship', (event) => {
      if ((event.data?.members || []).includes(userId)) load();
    });
    return () => { alive = false; off?.(); };
  }, [visible, userId, user?.id]);

  if (!visible || relation === 'friend') return null;

  const send = async () => {
    if (busy || relation === 'pending') return;
    setBusy(true);
    try {
      await base44.functions.invoke('friend-service', { action: 'request', user_id: userId });
      setRelation('pending');
      onChange?.();
      toast({ title: 'Arkadaşlık isteği gönderildi' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const iconClass = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <button
      type="button"
      onClick={send}
      disabled={busy || relation === 'pending'}
      className={`flex min-w-0 flex-1 items-center justify-center border-2 font-black text-white disabled:opacity-60 ${compact ? 'gap-1 rounded-xl px-2 py-1.5 text-[10px]' : 'gap-2 rounded-2xl px-4 py-3 text-sm'}`}
      style={{
        borderColor: accent,
        background: relation === 'pending' ? 'rgba(0,0,0,0.45)' : 'rgba(111,230,220,0.14)',
        boxShadow: `0 0 20px -8px ${accent}`,
      }}
    >
      {busy ? <Loader2 className={`${iconClass} shrink-0 animate-spin`} /> : relation === 'pending' ? <Check className={`${iconClass} shrink-0`} /> : <UserPlus className={`${iconClass} shrink-0`} />}
      <span className="truncate">{relation === 'pending' ? 'İstek Gönderildi' : 'Arkadaş Ekle'}</span>
    </button>
  );
}