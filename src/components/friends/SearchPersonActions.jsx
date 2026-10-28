import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, MessageSquare, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';

/**
 * Üye arama sonucundaki kişi için arkadaş ekleme ve özel sohbet başlatma.
 * Profil kartına girmeden doğrudan çalışır.
 */
export default function SearchPersonActions({ userId }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const [busy, setBusy] = useState('');
  const [requested, setRequested] = useState(false);
  if (!userId || !user?.id || user.id === userId) return null;

  const addFriend = async () => {
    if (busy || requested) return;
    setBusy('friend');
    try {
      await base44.functions.invoke('friend-service', { action: 'request', user_id: userId });
      setRequested(true);
      toast({ title: 'Arkadaşlık isteği gönderildi' });
    } catch (error) {
      const detail = error?.response?.data?.error || error.message;
      if (/zaten mevcut/i.test(detail || '')) setRequested(true);
      toast({ title: 'İstek gönderilemedi', description: detail, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const startChat = async () => {
    if (busy) return;
    setBusy('message');
    try {
      const response = await base44.functions.invoke('dm-service', { action: 'start', target_id: userId });
      const conversation = response?.data?.conversation;
      if (conversation?.id) {
        navigate(`/arkadaslar?view=chats&chat=${conversation.id}`);
        return;
      }
      toast({ title: 'Sohbet açılamadı', description: response?.data?.warning || 'Tekrar deneyin.', variant: 'destructive' });
    } catch (error) {
      toast({ title: 'Sohbet açılamadı', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={addFriend}
        disabled={!!busy || requested}
        className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#6fe6dc]/70 bg-[#062b4a]/70 px-2 py-2 text-[11px] font-black text-white disabled:opacity-70"
      >
        {busy === 'friend' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : requested ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
        {requested ? 'İstek Gönderildi' : 'Arkadaş Ekle'}
      </button>
      <button
        type="button"
        onClick={startChat}
        disabled={!!busy}
        className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#ff8a8a]/70 bg-[#3a0d1a]/70 px-2 py-2 text-[11px] font-black text-[#ffd6d6] disabled:opacity-70"
      >
        {busy === 'message' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
        Mesaj Gönder
      </button>
    </div>
  );
}