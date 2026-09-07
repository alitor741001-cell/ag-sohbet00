import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CreditCard } from 'lucide-react';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Payment.list('-created_date', 200).then((p) => { setPayments(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  const total = payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Ödemeler</h1>
      <div className="rounded-xl bg-card border border-border p-4 mb-6"><div className="flex items-center gap-2 mb-1"><CreditCard className="w-5 h-5 text-green-400" /><span className="text-sm text-muted-foreground">Toplam Gelir</span></div><p className="text-2xl font-bold text-white">{total.toLocaleString('tr-TR')} ₺</p></div>
      <div className="space-y-2">
        {payments.length === 0 ? <p className="text-center text-muted-foreground py-12">Ödeme yok</p> : payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
            <div><p className="font-medium text-white text-sm">{p.plan_name}</p><p className="text-xs text-muted-foreground">{new Date(p.created_date).toLocaleDateString('tr-TR')}</p></div>
            <div className="text-right"><p className="font-semibold text-white">{p.amount} {p.currency || '₺'}</p><span className={`text-xs ${p.status === 'completed' ? 'text-green-400' : p.status === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>{p.status === 'completed' ? 'Tamamlandı' : p.status === 'failed' ? 'Başarısız' : 'Beklemede'}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}