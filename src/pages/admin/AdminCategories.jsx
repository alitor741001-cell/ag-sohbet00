import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/use-toast';

export default function AdminCategories() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [movies, setMovies] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    base44.entities.Category.list(200).then(setItems).catch(() => {});
    base44.entities.Movie.list(500).then(setMovies).catch(() => {});
  };
  useEffect(load, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await base44.entities.Category.create({ name: name.trim(), slug: name.trim().toLowerCase() });
    toast({ title: 'Kategori oluşturuldu' });
    setName(''); load();
  };

  const startEdit = (c) => { setEditing(c.id); setEditName(c.name); };
  const saveEdit = async (c) => {
    if (!editName.trim()) return;
    await base44.entities.Category.update(c.id, { name: editName.trim(), slug: editName.trim().toLowerCase() });
    toast({ title: 'Kategori güncellendi' });
    setEditing(null); load();
  };

  const del = async () => {
    await base44.entities.Category.delete(confirm.id);
    toast({ title: 'Kategori silindi' });
    setConfirm(null); load();
  };

  const countFilms = (c) => movies.filter((m) => m.category_id === c.id || m.category === c.name).length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-4">Kategoriler</h1>
      <form onSubmit={add} className="flex gap-2 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kategori adı (örn: Aksiyon)" className="flex-1 bg-secondary/60 rounded-lg px-3 py-2 text-sm outline-none border border-border" />
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold">OLUŞTUR</button>
      </form>
      {items.length === 0 ? <p className="text-muted-foreground text-sm">Henüz kategori yok.</p> :
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {items.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-lg p-3">
              {editing === c.id ? (
                <div className="flex gap-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 bg-secondary/60 rounded-lg px-2 py-1.5 text-sm outline-none border border-border" autoFocus />
                  <button onClick={() => saveEdit(c)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">KAYDET</button>
                  <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg bg-secondary text-xs">İPTAL</button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{countFilms(c)} film</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => startEdit(c)} className="px-2.5 py-1.5 rounded-lg bg-secondary text-xs font-semibold">DÜZENLE</button>
                    <button onClick={() => setConfirm(c)} className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold">SİL</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>}
      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}
        title="Kategoriyi sil?"
        description={confirm ? `Bu kategoride ${countFilms(confirm)} film bulunuyor. Kategoriyi silmek istediğinize emin misiniz? (Filmler silinmeyecek.)` : ''}
        onConfirm={del} />
    </div>
  );
}