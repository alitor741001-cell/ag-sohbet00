import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Ban, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    base44.entities.User.list().then((u) => { setUsers(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()));

  const updateStatus = async (user, status) => {
    try {
      await base44.entities.User.update(user.id, { membership_status: status });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, membership_status: status } : u));
      toast({ title: 'Durum güncellendi' });
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  const banUser = async (user) => {
    try {
      await base44.entities.User.update(user.id, { role: 'banned' });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: 'banned' } : u));
      toast({ title: 'Kullanıcı engellendi' });
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Kullanıcılar ({users.length})</h1>
      <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara..." className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white" /></div>
      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-white font-semibold">{(u.full_name || u.username || '?').charAt(0)}</div>
            <div className="flex-1 min-w-0"><p className="font-medium text-white truncate">{u.full_name || u.username}</p><p className="text-xs text-muted-foreground truncate">{u.email} · @{u.username}</p></div>
            <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : u.role === 'banned' ? 'bg-red-500/20 text-red-400' : u.membership_status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{u.role === 'admin' ? 'Admin' : u.role === 'banned' ? 'Engelli' : u.membership_status === 'active' ? 'Aktif' : 'Pasif'}</span>
            <div className="flex gap-1">
              {u.membership_status !== 'active' && <button onClick={() => updateStatus(u, 'active')} className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center hover:bg-green-600/30" title="Aktif et"><CheckCircle className="w-4 h-4 text-green-400" /></button>}
              {u.role !== 'banned' && <button onClick={() => banUser(u)} className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center hover:bg-red-600/30" title="Engelle"><Ban className="w-4 h-4 text-red-400" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}