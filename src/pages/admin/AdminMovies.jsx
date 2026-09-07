import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Trash2, Edit, Film, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', poster_url: '', backdrop_url: '', video_url: '', trailer_url: '', type: 'movie', year: '', duration: '', rating: '', categories: '', cast: '', director: '', is_featured: false, is_published: true });

  useEffect(() => { load(); }, []);
  const load = () => { base44.entities.Movie.list('-created_date', 200).then((m) => { setMovies(m); setLoading(false); }).catch(() => setLoading(false)); };

  const filtered = movies.filter((m) => !search || m.title?.toLowerCase().includes(search.toLowerCase()));

  const save = async () => {
    try {
      const data = { ...form, year: form.year ? parseInt(form.year) : undefined, duration: form.duration ? parseInt(form.duration) : 0, rating: form.rating ? parseFloat(form.rating) : 0, categories: form.categories ? form.categories.split(',').map((s) => s.trim()) : [], cast: form.cast ? form.cast.split(',').map((s) => s.trim()) : [] };
      if (editing) { await base44.entities.Movie.update(editing, data); toast({ title: 'Güncellendi' }); }
      else { await base44.entities.Movie.create(data); toast({ title: 'Eklendi' }); }
      setShowForm(false); setEditing(null); load();
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  const edit = (m) => { setEditing(m.id); setForm({ title: m.title || '', description: m.description || '', poster_url: m.poster_url || '', backdrop_url: m.backdrop_url || '', video_url: m.video_url || '', trailer_url: m.trailer_url || '', type: m.type || 'movie', year: m.year || '', duration: m.duration || '', rating: m.rating || '', categories: (m.categories || []).join(', '), cast: (m.cast || []).join(', '), director: m.director || '', is_featured: m.is_featured, is_published: m.is_published }); setShowForm(true); };

  const del = async (m) => { try { await base44.entities.Movie.delete(m.id); toast({ title: 'Silindi' }); load(); } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); } };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold text-white">Filmler ({movies.length})</h1><Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-purple-600 hover:bg-purple-700 text-white"><Plus className="w-4 h-4 mr-1" /> Ekle</Button></div>
      <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara..." className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white" /></div>
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-card border border-border p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Düzenle' : 'Film Ekle'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-muted-foreground">Başlık</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-muted-foreground">Açıklama</Label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-white" /></div>
              <div><Label className="text-muted-foreground">Poster URL</Label><Input value={form.poster_url} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} /></div>
              <div><Label className="text-muted-foreground">Backdrop URL</Label><Input value={form.backdrop_url} onChange={(e) => setForm({ ...form, backdrop_url: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-muted-foreground">Video URL</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} /></div>
              <div><Label className="text-muted-foreground">Tür</Label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-white"><option value="movie">Film</option><option value="series">Dizi</option></select></div>
              <div><Label className="text-muted-foreground">Yıl</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
              <div><Label className="text-muted-foreground">Süre (dk)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
              <div><Label className="text-muted-foreground">Puan</Label><Input type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
              <div><Label className="text-muted-foreground">Kategoriler (virgülle)</Label><Input value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} /></div>
              <div><Label className="text-muted-foreground">Oyuncular (virgülle)</Label><Input value={form.cast} onChange={(e) => setForm({ ...form, cast: e.target.value })} /></div>
              <div><Label className="text-muted-foreground">Yönetmen</Label><Input value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} /></div>
              <div className="col-span-2 flex gap-4"><label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Öne Çıkan</label><label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Yayında</label></div>
            </div>
            <div className="flex gap-2 mt-4"><Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">İptal</Button><Button onClick={save} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">Kaydet</Button></div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map((m) => (
          <div key={m.id} className="group relative">
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">{m.poster_url ? <img src={m.poster_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-muted-foreground" /></div>}</div>
            <p className="text-sm text-white truncate mt-1">{m.title}</p>
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100"><button onClick={() => edit(m)} className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"><Edit className="w-3.5 h-3.5 text-white" /></button><button onClick={() => del(m)} className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button></div>
          </div>
        ))}
      </div>
    </div>
  );
}