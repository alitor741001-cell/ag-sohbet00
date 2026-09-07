import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  useEffect(() => { load(); }, []);
  const load = () => { base44.entities.Category.list().then((c) => { setCategories(c); setLoading(false); }).catch(() => setLoading(false)); };

  const add = async () => {
    if (!name.trim()) return;
    try { await base44.entities.Category.create({ name: name, slug: name.toLowerCase().replace(/ /g, '-'), is_active: true }); toast({ title: 'Kategori eklendi' }); setName(''); load(); }
    catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  const del = async (c) => { try { await base44.entities.Category.delete(c.id); toast({ title: 'Silindi' }); load(); } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); } };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Kategoriler</h1>
      <div className="max-w-md rounded-xl bg-card border border-border p-4 mb-6">
        <div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kategori adı" /><Button onClick={add} className="bg-purple-600 hover:bg-purple-700 text-white"><Plus className="w-4 h-4 mr-1" /> Ekle</Button></div>
      </div>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-purple-400" /><span className="text-white text-sm">{c.name}</span></div>
            <button onClick={() => del(c)} className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center hover:bg-red-600/30"><Trash2 className="w-4 h-4 text-red-400" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}