import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Monitor, Circle } from 'lucide-react';

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => base44.entities.UserPresence.list('-updated_date', 100).then((s) => setSessions(s)).catch(() => {}).finally(() => setLoading(false));
    load();
    const unsub = base44.entities.UserPresence.subscribe(() => load());
    return unsub;
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  const online = sessions.filter((s) => s.is_online);
  const offline = sessions.filter((s) => !s.is_online);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Oturumlar ({online.length} çevrimiçi)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><Circle className="w-3 h-3 fill-green-400 text-green-400" /><p className="text-sm text-muted-foreground">Çevrimiçi</p></div>
          <p className="text-2xl font-bold text-white">{online.length}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><Circle className="w-3 h-3 fill-muted-foreground text-muted-foreground" /><p className="text-sm text-muted-foreground">Çevrimdışı (son 100)</p></div>
          <p className="text-2xl font-bold text-white">{offline.length}</p>
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Aktif Oturumlar</h2>
        <div className="space-y-2">
          {online.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Çevrimiçi kullanıcı yok</p> : online.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
              <Monitor className="w-4 h-4 text-green-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{s.user_name || s.user_id}</p>
                <p className="text-xs text-muted-foreground">{s.page || 'Bilinmeyen sayfa'} · {s.device || 'Bilinmeyen cihaz'}</p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(s.updated_date).toLocaleTimeString('tr-TR')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}