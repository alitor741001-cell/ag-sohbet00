import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageCircle, Send, Plus, ChevronLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function Support() {
  const { user, loading } = useCurrentUser();
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);

  const loadTickets = () => {
    if (!user) return;
    base44.entities.Notification.filter({ user_id: user.id, type: 'support_ticket' }).then(setTickets).catch(() => {});
  };

  useEffect(() => { loadTickets(); }, [user?.id]);

  useEffect(() => {
    if (!activeTicket) return;
    base44.entities.ChatMessage.filter({ room_id: activeTicket.id }).then(setMessages).catch(() => {});
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.room_id === activeTicket.id) {
        setMessages((prev) => event.type === 'delete' ? prev.filter((m) => m.id !== event.id) : [event.data, ...prev]);
      }
    });
    return unsub;
  }, [activeTicket?.id]);

  const createTicket = async () => {
    if (!newSubject.trim()) return;
    setCreating(true);
    try {
      const ticket = await base44.entities.Notification.create({ user_id: user.id, type: 'support_ticket', title: newSubject, body: newMessage, is_read: false });
      if (newMessage.trim()) {
        await base44.entities.ChatMessage.create({ room_id: ticket.id, user_id: user.id, user_name: user.full_name || user.username, content: newMessage, type: 'text' });
      }
      base44.functions.invoke('admin-notify', { event: 'support_ticket', ref_id: `ticket:${ticket.id}`, title: 'Yeni destek talebi', body: newSubject, link: '/admin/destek' }).catch(() => {});
      toast({ title: 'Talep oluşturuldu', description: 'En kısa sürede yanıtlanacak.' });
      setNewSubject(''); setNewMessage(''); loadTickets();
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
    finally { setCreating(false); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeTicket) return;
    setSending(true);
    try {
      await base44.entities.ChatMessage.create({ room_id: activeTicket.id, user_id: user.id, user_name: user.full_name || user.username, content: newMessage, type: 'text' });
      setNewMessage('');
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  if (loading || !user) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Destek</h1>
      {activeTicket ? (
        <div>
          <button onClick={() => setActiveTicket(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white mb-4"><ChevronLeft className="w-4 h-4" /> Taleplere dön</button>
          <h2 className="text-lg font-semibold text-white mb-4">{activeTicket.title}</h2>
          <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto">
            {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Henüz mesaj yok</p>}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${m.user_id === user.id ? 'bg-purple-600 text-white' : 'bg-white/10 text-white'}`}>
                  <p className="text-sm">{m.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Mesajınız..." onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1" />
            <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="bg-purple-600 hover:bg-purple-700 text-white"><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Yeni Talep</h2>
            <div className="space-y-3">
              <div><Label className="text-muted-foreground">Konu</Label><Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Sorunun konusu" /></div>
              <div><Label className="text-muted-foreground">Mesaj</Label><textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Detaylı açıklayın..." rows={4} className="w-full bg-background border border-border rounded-lg p-3 text-sm text-white resize-none" /></div>
              <Button onClick={createTicket} disabled={creating || !newSubject.trim()} className="w-full bg-purple-600 hover:bg-purple-700 text-white">{creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Talep Oluştur</Button>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Taleplerim ({tickets.length})</h2>
            <div className="space-y-2">
              {tickets.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Henüz talep yok</p>}
              {tickets.map((t) => (
                <button key={t.id} onClick={() => setActiveTicket(t)} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-border">
                  <p className="font-medium text-white text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(t.created_date).toLocaleDateString('tr-TR')}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}