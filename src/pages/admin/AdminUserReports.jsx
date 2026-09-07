import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Flag, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function AdminUserReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Notification.filter({ type: 'user_report' }).then((r) => { setReports(r); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const resolve = async (r) => {
    try { await base44.entities.Notification.update(r.id, { is_read: true }); setReports((prev) => prev.filter((x) => x.id !== r.id)); toast({ title: 'Şikayet çözüldü olarak işaretlendi' }); }
    catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Şikayetler ({reports.length})</h1>
      <div className="space-y-2">
        {reports.length === 0 ? <p className="text-center text-muted-foreground py-12">Şikayet yok</p> : reports.map((r) => (
          <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
            <Flag className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1"><p className="font-medium text-white text-sm">{r.title}</p><p className="text-xs text-muted-foreground mt-1">{r.body}</p><p className="text-xs text-muted-foreground mt-1">{new Date(r.created_date).toLocaleDateString('tr-TR')}</p></div>
            <button onClick={() => resolve(r)} className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center hover:bg-green-600/30"><Check className="w-4 h-4 text-green-400" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}