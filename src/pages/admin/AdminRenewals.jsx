import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Check, X, Trash2, Eye } from 'lucide-react';

export default function AdminRenewals() {
  const { user: admin } = useCurrentUser();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const load = () => { base44.entities.MembershipRenewal.list(200).then(setItems).catch(() => {}); };
  useEffect(load, []);
  const log = async (action, target) => { await base44.entities.AdminLog.create({ admin_id: admin?.id, admin_name: admin?.username, action, target }).catch(() => {}); };

  const approve = async (r) => {
    const end = new Date(); end.setDate(end.getDate() + 30);
    await base44.asServiceRole.entities.User.update(r.user_id, { membership_status: 'active', membership_end: end.toISOString() });
    await base44.entities.MembershipRenewal.update(r.id, { status: 'approved' });
    await base44.entities.Notification.create({ user_id: r.user_id, title: 'Yenileme talebiniz onaylandı', body: 'Üyeliğiniz 30 gün uzatıldı.', type: 'info' });
    await log('Yenileme onaylandı', r.user_name); toast({ title: 'Onaylandı' }); load();
  };
  const reject = async (r) => {
    await base44.entities.MembershipRenewal.update(r.id, { status: 'rejected' });
    await base44.entities.Notification.create({ user_id: r.user_id, title: 'Yenileme talebiniz reddedildi', body: 'Lütfen destek ile iletişime geçin.', type: 'info' });
    await log('Yenileme reddedildi', r.user_name); toast({ title: 'Reddedildi' }); load();
  };
  const del = async () => { await base44.entities.MembershipRenewal.delete(confirm.id); toast({ title: 'Silindi' }); setConfirm(null); load(); };

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-4">Yenileme Talepleri</h1>
      {items.length === 0 ? <p className="text-muted-foreground text-sm">Talep yok.</p> :
        <div className="overflow-x-auto bg-card border border-border rounded-xl">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase"><tr><th className="text-left p-3">Kullanıcı</th><th className="text-left p-3">Mevcut</th><th className="text-left p-3">İstenen</th><th className="text-left p-3">Tarih</th><th className="text-left p-3">Durum</th><th className="text-right p-3">İşlem</th></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-medium">{r.user_name}</td>
                  <td className="p-3 text-muted-foreground">{r.current_package}</td>
                  <td className="p-3">{r.requested_package}</td>
                  <td className="p-3 text-muted-foreground">{new Date(r.created_date).toLocaleDateString('tr-TR')}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : r.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{r.status}</span></td>
                  <td className="p-3"><div className="flex justify-end gap-1">
                    {r.status === 'pending' && <><button onClick={() => approve(r)} className="p-1.5 rounded bg-green-500/20 text-green-400"><Check className="w-4 h-4" /></button><button onClick={() => reject(r)} className="p-1.5 rounded bg-red-500/20 text-red-400"><X className="w-4 h-4" /></button></>}
                    <button onClick={() => setConfirm(r)} className="p-1.5 rounded bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title="Talebi sil?" onConfirm={del} />
    </div>
  );
}