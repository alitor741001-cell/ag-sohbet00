import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Video, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function AdminPromoVideo() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', video_url: '' });

  useEffect(() => { base44.entities.PromoVideo.list().then((v) => { setVideos(v); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const add = async () => {
    if (!form.video_url.trim()) return;
    try { await base44.entities.PromoVideo.create({ title: form.title, video_url: form.video_url, is_active: true }); toast({ title: 'Video eklendi' }); setForm({ title: '', video_url: '' }); base44.entities.PromoVideo.list().then(setVideos); }
    catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  const del = async (v) => { try { await base44.entities.PromoVideo.delete(v.id); toast({ title: 'Silindi' }); base44.entities.PromoVideo.list().then(setVideos); } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); } };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Tanıtım Videoları</h1>
      <div className="max-w-md rounded-xl bg-card border border-border p-4 mb-6 space-y-3">
        <div><Label className="text-muted-foreground">Başlık</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label className="text-muted-foreground">Video URL</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} /></div>
        <Button onClick={add} className="w-full bg-purple-600 hover:bg-purple-700 text-white"><Plus className="w-4 h-4 mr-1" /> Ekle</Button>
      </div>
      <div className="space-y-2">
        {videos.map((v) => (
          <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            <Video className="w-5 h-5 text-purple-400" />
            <div className="flex-1"><p className="text-sm font-medium text-white">{v.title || 'Video'}</p><p className="text-xs text-muted-foreground truncate">{v.video_url}</p></div>
            <button onClick={() => del(v)} className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center hover:bg-red-600/30"><Trash2 className="w-4 h-4 text-red-400" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}