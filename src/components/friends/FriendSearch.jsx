import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';
import FullUserProfile from '@/components/profile/FullUserProfile';

export default function FriendSearch({ invoke }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [memberId, setMemberId] = useState(''); const [result, setResult] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  const search = async (e) => { e.preventDefault(); setBusy(true); setStatus(''); setProfileOpen(false);
    try { const data = await invoke({ action: 'search', member_id: memberId }); setResult(data.user); if (!data.user) setStatus('Kullanıcı bulunamadı.'); }
    catch (e) { setStatus(e.response?.data?.error || e.message); } finally { setBusy(false); }
  };
  const add = async () => { setBusy(true); try { await invoke({ action: 'request', user_id: result.id }); setStatus('Arkadaşlık isteği gönderildi.'); setResult(null); }
    catch (e) { setStatus(e.response?.data?.error || e.message); } finally { setBusy(false); } };
  // Karttaki "Mesaj Yaz": özel sohbeti açar ve sohbet ekranına geçer (aynen sohbet panelindeki gibi).
  const openChat = async (targetId) => {
    try {
      const res = await base44.functions.invoke('dm-service', { action: 'start', target_id: targetId });
      if (res?.data?.warning) toast({ description: res.data.warning, duration: 6000 });
      if (res?.data?.conversation) navigate(`/arkadaşlar?view=chats&chat=${res.data.conversation.id}`);
    } catch (error) {
      toast({ title: 'Sohbet açılamadı', description: error.response?.data?.error || error.message, variant: 'destructive' });
    }
  };
  return <section className="bg-card border border-border rounded-xl p-4">
    <h2 className="font-bold mb-3">Üye No ile Arkadaş Bul</h2>
    <form onSubmit={search} className="flex gap-2"><input value={memberId} onChange={(e) => setMemberId(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="8 haneli üye numarası" className="flex-1 min-w-0 bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /><button disabled={busy || memberId.length !== 8} className="bg-primary text-primary-foreground rounded-lg px-3 disabled:opacity-50"><Search className="w-4 h-4" /></button></form>
    {result && <div className="mt-3 flex items-center gap-2 bg-secondary/60 rounded-lg p-3">
      <button type="button" onClick={() => setProfileOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70" aria-label="Profil kartını aç">
        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
          {result.avatar
            ? <Image src={result.avatar} alt={result.name} className="h-full w-full" fittingType="fill" draggable={false} />
            : <span className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">{String(result.name || '?').trim().charAt(0).toUpperCase()}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{result.name}</span>
          <span className="block truncate text-xs text-muted-foreground">Kimlik: {result.member_id || '—'}</span>
        </span>
      </button>
      <button onClick={add} disabled={busy} className="flex shrink-0 items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold"><UserPlus className="w-4 h-4" /> İstek Gönder</button>
    </div>}
    {status && <p className="mt-2 text-xs text-muted-foreground">{status}</p>}
    {profileOpen && result && <FullUserProfile
      userId={result.id}
      name={result.name}
      avatar={result.avatar}
      onClose={() => setProfileOpen(false)}
      onMessage={openChat}
    />}
  </section>;
}