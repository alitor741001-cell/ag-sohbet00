import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Bell, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', body: '' });

  useEffect(() => {
    base44.entities.Notification.list('-created_date', 50).then((n) => { setNotifications(n); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const send = async () => {
    if (!form.title.trim()) return;
    try {
      const users = await base44.entities.User.list();
      await base44.entities.Notification.bulkCreate(users.map((u) => ({ user_id: u.id, type: 'announcement', title: form.title, body: form.body, is_read: false })));
      toast({ title: 'Bildirim gönderildi', description: `${users.length} kullanıcıya` });
      setForm({ title: '', body: '' });
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Bildirimler</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-card border border-border p-4">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Send className="w-5 h-5" /> Toplu Bildirim</h2>
          <div className="space-y-3">
            <div><Label className="text-muted-foreground">Başlık</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label className="text-muted-foreground">İçerik</Label><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-white" /></div>
            <Button onClick={send} disabled={!form.title.trim()} className="w-full bg-purple-600 hover:bg-purple-700 text-white">Gönder</Button>
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Bell className="w-5 h-5" /> Son Bildirimler</h2>
          <div className="space-y-2">
            {notifications.slice(0, 20).map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-card border border-border"><p className="font-medium text-white text-sm">{n.title}</p><p className="text-xs text-muted-foreground mt-1">{new Date(n.created_date).toLocaleDateString('tr-TR')}</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}