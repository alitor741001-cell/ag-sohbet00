import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, MessageSquare, ChevronLeft, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Notification.filter({ type: 'support_ticket' }).then((t) => { setTickets(t); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    base44.entities.ChatMessage.filter({ room_id: active.id }).then((m) => setMessages((m || []).sort((a, b) => new Date(a.created_date) - new Date(b.created_date)))).catch(() => {});
  }, [active?.id]);

  const reply = async () => {
    if (!input.trim() || !active) return;
    try {
      await base44.entities.ChatMessage.create({ room_id: active.id, user_id: 'admin', user_name: 'Destek', content: input, type: 'text' });
      setInput('');
      toast({ title: 'Yanıt gönderildi' });
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Destek Talepleri</h1>
      {active ? (
        <div>
          <button onClick={() => setActive(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white mb-4"><ChevronLeft className="w-4 h-4" /> Listeye dön</button>
          <h2 className="text-lg font-semibold text-white mb-4">{active.title}</h2>
          <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
            {messages.map((m) => <div key={m.id} className={`flex ${m.user_id === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[70%] rounded-xl px-3 py-2 ${m.user_id === 'admin' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white'}`}><p className="text-sm">{m.content}</p></div></div>)}
          </div>
          <div className="flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && reply()} placeholder="Yanıt..." className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-white" /><button onClick={reply} className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center"><Send className="w-4 h-4 text-white" /></button></div>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.length === 0 ? <p className="text-center text-muted-foreground py-12">Talep yok</p> : tickets.map((t) => (
            <button key={t.id} onClick={() => setActive(t)} className="w-full text-left p-3 rounded-lg bg-card border border-border hover:bg-white/5">
              <p className="font-medium text-white text-sm">{t.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(t.created_date).toLocaleDateString('tr-TR')}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}