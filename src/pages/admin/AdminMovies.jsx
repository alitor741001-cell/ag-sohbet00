import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Image } from '@/components/ui/image';
import { Trash2, Edit, Upload, Eye, EyeOff, Plus } from 'lucide-react';

const empty = { title: '', description: '', type: 'movie', poster: '', backdrop: '', trailer: '', video_url: '', hls_url: '', external_url: '', category: '', category_id: '', genres: '', cast: '', director: '', year: 2024, imdb: 0, duration: 0, language: 'Türkçe', subtitle: 'Altyazılı', quality: 'HD', age_rating: '+13', featured: false, popular: false, published: true };

export default function AdminMovies({ seriesOnly = false }) {
  const { user: admin } = useCurrentUser();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [cats, setCats] = useState([]);

  const load = () => {
    base44.entities.Movie.filter(seriesOnly ? { type: 'series' } : {}, '-created_date', 500).then((r) => { setItems(r); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, [seriesOnly]);
  useEffect(() => { base44.entities.Category.list(200).then(setCats).catch(() => {}); }, []);

  const log = async (action, target) => { await base44.entities.AdminLog.create({ admin_id: admin?.id, admin_name: admin?.username, action, target }).catch(() => {}); };

  const openNew = () => { setForm({ ...empty, type: seriesOnly ? 'series' : 'movie' }); setEditing('new'); };
  const openEdit = (m) => { setForm({ ...m, category_id: m.category_id || '', genres: (m.genres || []).join(', '), cast: (m.cast || []).join(', ') }); setEditing(m.id); };

  const save = async (e) => {
    e.preventDefault();
    const cat = cats.find((c) => c.id === form.category_id);
    const data = { ...form, category: cat?.name || form.category || '', year: Number(form.year), imdb: Number(form.imdb), duration: Number(form.duration), genres: form.genres.split(',').map((s) => s.trim()).filter(Boolean), cast: form.cast.split(',').map((s) => s.trim()).filter(Boolean) };
    try {
      if (!form.category_id) { toast({ title: 'Lütfen bir kategori seçin', variant: 'destructive' }); return; }
    if (editing === 'new') { await base44.entities.Movie.create(data); await log('Film eklendi', data.title); }
      else { await base44.entities.Movie.update(editing, data); await log('Film güncellendi', data.title); }
      toast({ title: 'Kaydedildi' }); setEditing(null); load();
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  const del = async () => { await base44.entities.Movie.delete(confirm.id); await log('Film silindi', confirm.title); toast({ title: 'Silindi' }); setConfirm(null); load(); };
  const togglePublish = async (m) => { await base44.entities.Movie.update(m.id, { published: !m.published }); load(); };

  const onPoster = async (e, field) => { const f = e.target.files?.[0]; if (!f) return; try { const { file_url } = await base44.integrations.Core.UploadFile({ file: f }); setForm((s) => ({ ...s, [field]: file_url })); } catch { toast({ title: 'Yükleme hatası', variant: 'destructive' }); } };

  const field = "w-full bg-secondary/60 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring border border-border";

  if (editing) return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold mb-4">{editing === 'new' ? 'Yeni İçerik' : 'Düzenle'}</h1>
      <form onSubmit={save} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={field} placeholder="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <select className={field} value={form.category_id || ''} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
            <option value="">Kategori seçin...</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <textarea className={field} placeholder="Açıklama" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={field} placeholder="Türler (virgülle)" value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} />
          <input className={field} placeholder="Oyuncular (virgülle)" value={form.cast} onChange={(e) => setForm({ ...form, cast: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <input className={field} placeholder="Yönetmen" value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} />
          <input className={field} type="number" placeholder="Yıl" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          <input className={field} type="number" step="0.1" placeholder="IMDb" value={form.imdb} onChange={(e) => setForm({ ...form, imdb: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <input className={field} type="number" placeholder="Süre (dk)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <select className={field} value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}><option>HD</option><option>Full HD</option><option>4K</option></select>
          <select className={field} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="movie">Film</option><option value="series">Dizi</option></select>
        </div>
        <input className={field} placeholder="Video URL (MP4)" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
        <input className={field} placeholder="HLS / M3U8 URL" value={form.hls_url} onChange={(e) => setForm({ ...form, hls_url: e.target.value })} />
        <input className={field} placeholder="Harici Video URL" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-xs text-muted-foreground">Poster URL veya yükle</label><div className="flex gap-2"><input className={field} placeholder="Poster URL" value={form.poster} onChange={(e) => setForm({ ...form, poster: e.target.value })} /><label className="p-2 bg-secondary rounded-lg cursor-pointer"><Upload className="w-4 h-4" /><input type="file" accept="image/*" className="hidden" onChange={(e) => onPoster(e, 'poster')} /></label></div></div>
          <div><label className="text-xs text-muted-foreground">Backdrop URL veya yükle</label><div className="flex gap-2"><input className={field} placeholder="Backdrop URL" value={form.backdrop} onChange={(e) => setForm({ ...form, backdrop: e.target.value })} /><label className="p-2 bg-secondary rounded-lg cursor-pointer"><Upload className="w-4 h-4" /><input type="file" accept="image/*" className="hidden" onChange={(e) => onPoster(e, 'backdrop')} /></label></div></div>
        </div>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-primary" /> Öne çıkar</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} className="accent-primary" /> Popüler</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="accent-primary" /> Yayında</label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold">Kaydet</button>
          <button type="button" onClick={() => setEditing(null)} className="bg-secondary px-5 py-2.5 rounded-lg text-sm">İptal</button>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold">{seriesOnly ? 'Diziler' : 'Filmler'}</h1>
        <button onClick={openNew} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Ekle</button>
      </div>
      {loading ? <p className="text-muted-foreground">Yükleniyor...</p> :
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="relative aspect-[2/3]">
                {m.poster ? <Image src={m.poster} className="w-full h-full object-cover" fittingType="fill" /> : <div className="w-full h-full bg-secondary" />}
                {!m.published && <span className="absolute top-1 left-1 text-xs bg-black/70 px-1.5 py-0.5 rounded">Yayında değil</span>}
              </div>
              <div className="p-2">
                <p className="text-sm font-semibold truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground mb-2">{m.year} · {m.quality}</p>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(m)} className="flex-1 p-1.5 rounded bg-secondary text-xs flex items-center justify-center gap-1"><Edit className="w-3 h-3" /> Düzenle</button>
                  <button onClick={() => togglePublish(m)} className="p-1.5 rounded bg-secondary">{m.published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</button>
                  <button onClick={() => setConfirm(m)} className="p-1.5 rounded bg-red-500/20 text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>}
      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title="İçeriği sil?" description={`${confirm?.title} silinecek.`} onConfirm={del} />
    </div>
  );
}