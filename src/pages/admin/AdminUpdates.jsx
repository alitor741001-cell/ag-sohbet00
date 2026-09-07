import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function AdminUpdates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ version: '', title: '', body: '' });

  useEffect(() => { base44.entities.UpdateAnnouncement.list('-created_date', 50).then((u) => { setUpdates(u); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const add = async () => {
    if (!form.title.trim()) return;
    try { await base44.entities.UpdateAnnouncement.create({ ...form, date: new Date().toISOString(), is_active: true }); toast({ title: 'Güncelleme yayınlandı' }); setForm({ version: '', title: '', body: '' }); base44.entities.UpdateAnnouncement.list('-created_date', 50).then(setUpdates); }
    catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  const del = async (u) => { try { await base44.entities.UpdateAnnouncement.delete(u.id); toast({ title: 'Silindi' }); base44.entities.UpdateAnnouncement.list('-created_date', 50).then(setUpdates); } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); } };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Güncellemeler</h1>
      <div className="max-w-md rounded-xl bg-card border border-border p-4 mb-6 space-y-3">
        <div><Label className="text-muted-foreground">Sürüm</Label><Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="v1.0.0" /></div>
        <div><Label className="text-muted-foreground">Başlık</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label className="text-muted-foreground">İçerik</Label><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-white" /></div>
        <Button onClick={add} className="w-full bg-purple-600 hover:bg-purple-700 text-white"><Plus className="w-4 h-4 mr-1" /> Yayınla</Button>
      </div>
      <div className="space-y-2">
        {updates.map((u) => (
          <div key={u.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
            <RefreshCw className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="flex-1"><p className="font-medium text-white text-sm">{u.title} {u.version && <span className="text-xs text-muted-foreground">({u.version})</span>}</p><p className="text-xs text-muted-foreground mt-1">{u.body}</p><p className="text-xs text-muted-foreground mt-1">{new Date(u.created_date).toLocaleDateString('tr-TR')}</p></div>
            <button onClick={() => del(u)} className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center hover:bg-red-600/30"><Trash2 className="w-4 h-4 text-red-400" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}