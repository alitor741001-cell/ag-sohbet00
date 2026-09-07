import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, Shield, UserCog } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function AdminRoles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    base44.entities.User.list().then((u) => { setUsers(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const setRole = async (user, role) => {
    try {
      await base44.entities.User.update(user.id, { role });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role } : u));
      toast({ title: 'Rol güncellendi', description: `${user.full_name || user.email} → ${role === 'admin' ? 'Admin' : role === 'moderator' ? 'Moderatör' : 'Kullanıcı'}` });
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  const filtered = users.filter((u) => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
  const roleLabel = (r) => r === 'admin' ? 'Admin' : r === 'moderator' ? 'Moderatör' : r === 'banned' ? 'Engelli' : 'Kullanıcı';
  const roleColor = (r) => r === 'admin' ? 'bg-purple-500/20 text-purple-400' : r === 'moderator' ? 'bg-blue-500/20 text-blue-400' : r === 'banned' ? 'bg-red-500/20 text-red-400' : 'bg-muted text-muted-foreground';

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Roller</h1>
      <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kullanıcı ara..." className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white" /></div>
      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-white font-semibold">{(u.full_name || '?').charAt(0)}</div>
            <div className="flex-1 min-w-0"><p className="font-medium text-white truncate">{u.full_name || u.email}</p><p className="text-xs text-muted-foreground truncate">{u.email}</p></div>
            <span className={`text-xs px-2 py-1 rounded-full ${roleColor(u.role)}`}>{roleLabel(u.role)}</span>
            <div className="flex gap-1">
              {u.role !== 'admin' && <button onClick={() => setRole(u, 'admin')} className="px-2 py-1 rounded-lg bg-purple-600/20 text-purple-400 text-xs hover:bg-purple-600/30 flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</button>}
              {u.role !== 'moderator' && <button onClick={() => setRole(u, 'moderator')} className="px-2 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-xs hover:bg-blue-600/30 flex items-center gap-1"><UserCog className="w-3 h-3" /> Mod</button>}
              {u.role !== 'user' && <button onClick={() => setRole(u, 'user')} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs hover:bg-muted/70">Kullanıcı</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}