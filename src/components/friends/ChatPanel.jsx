import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function ChatPanel({ conversation, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    base44.entities.ChatMessage.filter({ room_id: conversation.id }).then((items) => {
      setMessages((items || []).sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    }).catch(() => {});
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.room_id !== conversation.id) return;
      setMessages((prev) => {
        if (event.type === 'delete') return prev.filter((m) => m.id !== event.id);
        const filtered = prev.filter((m) => m.id !== event.id);
        return [...filtered, event.data].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      });
    });
    return unsub;
  }, [conversation?.id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !conversation) return;
    setSending(true);
    try {
      await base44.entities.ChatMessage.create({ room_id: conversation.id, user_id: user.id, user_name: user.full_name || user.username, content: input, type: 'text' });
      setInput('');
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  if (!conversation) return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Bir sohbet seçin</div>;

  return (
    <div className="flex flex-col h-full rounded-2xl bg-card border border-border overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Mesaj yok</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${m.user_id === user.id ? 'bg-purple-600 text-white' : 'bg-white/10 text-white'}`}>
              {m.user_id !== user.id && <p className="text-xs font-semibold text-purple-300 mb-1">{m.user_name}</p>}
              <p className="text-sm">{m.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Mesaj..." className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-white" />
        <button onClick={send} disabled={sending || !input.trim()} className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center hover:bg-purple-700 disabled:opacity-50">
          {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>
    </div>
  );
}