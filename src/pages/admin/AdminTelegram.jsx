import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function AdminTelegram() {
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!chatId.trim() || !message.trim()) return;
    setSending(true);
    try {
      await base44.functions.invoke('admin-notify', { event: 'telegram_test', telegram_data: { chat_id: chatId, message } });
      toast({ title: 'Mesaj gönderildi' });
      setMessage('');
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Telegram</h1>
      <div className="max-w-md rounded-xl bg-card border border-border p-4">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Send className="w-5 h-5" /> Test Mesajı</h2>
        <div className="space-y-3">
          <div><Label className="text-muted-foreground">Chat ID</Label><Input value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="123456789" /></div>
          <div><Label className="text-muted-foreground">Mesaj</Label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-white" /></div>
          <Button onClick={send} disabled={sending || !chatId.trim() || !message.trim()} className="w-full bg-purple-600 hover:bg-purple-700 text-white">{sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Gönder</Button>
        </div>
      </div>
    </div>
  );
}