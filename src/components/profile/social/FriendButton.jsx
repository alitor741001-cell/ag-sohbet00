import { useState } from 'react';
import { Check, Loader2, UserMinus, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useProfileFriendship from '@/hooks/useProfileFriendship';

export default function FriendButton({ userId, accent = '#6fe6dc', compact = true, onChange }) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { friendship, loading, error, refresh } = useProfileFriendship(userId);
  const [busy, setBusy] = useState(false);
  const accepted = friendship?.status === 'accepted';
  const pending = friendship?.status === 'pending';
  const blocked = friendship?.status === 'blocked' || user?.blocked_users?.includes(userId);
  if (!user?.id || !userId || userId === user.id) return null;
  const send = async event => {
    event.stopPropagation();
    if (busy || loading || pending || blocked) return;
    setBusy(true);
    try {
      await base44.functions.invoke('friend-service', accepted
        ? { action: 'unfriend', friendship_id: friendship.id }
        : { action: 'request', user_id: userId });
      await refresh();
      onChange?.();
      toast({ title: accepted ? 'Arkadaşlıktan çıkarıldı' : 'Arkadaşlık isteği gönderildi' });
    } catch (failure) {
      toast({ title: 'İşlem başarısız', description: failure.response?.data?.error || failure.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };
  const Icon = busy || loading ? Loader2 : accepted ? UserMinus : pending ? Check : UserPlus;
  return <button type="button" onClick={send} disabled={busy || loading || pending || blocked || !!error}
    className={`flex min-w-0 flex-1 items-center justify-center border-2 font-black text-fantasy-text disabled:opacity-60 ${compact ? 'gap-1 rounded-xl px-2 py-1.5 text-[10px]' : 'gap-2 rounded-2xl px-4 py-3 text-sm'}`}
    style={{ borderColor: accent }}>
    <Icon className={`h-3.5 w-3.5 shrink-0 ${busy || loading ? 'animate-spin' : ''}`} />
    <span>{accepted ? 'Arkadaşlıktan Çıkar' : pending ? 'İstek Gönderildi' : 'Arkadaş Ekle'}</span>
  </button>;
}