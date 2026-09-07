import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export default function AdminSecurity() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.User.list().then((u) => { setUsers(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggle2FA = async (user) => {
    try {
      await base44.entities.User.update(user.id, { twofa_enabled: !user.twofa_enabled });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, twofa_enabled: !u.twofa_enabled } : u));
      toast({ title: user.twofa_enabled ? '2FA devre dışı bırakıldı' : '2FA etkinleştirildi' });
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  const admins = users.filter((u) => u.role === 'admin' || u.role === 'moderator');
  const with2FA = admins.filter((u) => u.twofa_enabled).length;
  const without2FA = admins.length - with2FA;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Güvenlik</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-card border border-border p-4">
          <ShieldCheck className="w-6 h-6 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-white">{with2FA}</p>
          <p className="text-sm text-muted-foreground">2FA Etkin</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <AlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{without2FA}</p>
          <p className="text-sm text-muted-foreground">2FA Bekliyor</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <Shield className="w-6 h-6 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-white">{admins.length}</p>
          <p className="text-sm text-muted-foreground">Yetkili Kullanıcı</p>
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Yönetici 2FA Durumu</h2>
        <div className="space-y-2">
          {admins.length === 0 ? <p className="text-sm text-muted-foreground">Yetkili kullanıcı yok</p> : admins.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
              <Lock className={`w-4 h-4 ${u.twofa_enabled ? 'text-green-400' : 'text-amber-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{u.full_name || u.email}</p>
                <p className="text-xs text-muted-foreground">{u.role === 'admin' ? 'Admin' : 'Moderatör'}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${u.twofa_enabled ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{u.twofa_enabled ? 'Etkin' : 'Pasif'}</span>
              <Button onClick={() => toggle2FA(u)} variant="outline" size="sm" className="text-xs">{u.twofa_enabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}