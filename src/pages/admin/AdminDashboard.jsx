import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Film, CreditCard, MessageSquare, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, movies: 0, payments: 0, tickets: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [users, movies, payments, tickets] = await Promise.all([
          base44.entities.User.list().catch(() => []),
          base44.entities.Movie.list().catch(() => []),
          base44.entities.Payment.filter({ status: 'completed' }).catch(() => []),
          base44.entities.Notification.filter({ type: 'support_ticket' }).catch(() => []),
        ]);
        setStats({
          users: users.length,
          movies: movies.length,
          payments: payments.length,
          tickets: tickets.length,
          revenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        });
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const cards = [
    { label: 'Kullanıcılar', value: stats.users, icon: Users, color: 'text-blue-400' },
    { label: 'Filmler', value: stats.movies, icon: Film, color: 'text-purple-400' },
    { label: 'Ödemeler', value: stats.payments, icon: CreditCard, color: 'text-green-400' },
    { label: 'Destek Talepleri', value: stats.tickets, icon: MessageSquare, color: 'text-amber-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Panel</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-2"><c.icon className={`w-6 h-6 ${c.color}`} /></div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-green-400" /><h2 className="text-lg font-semibold text-white">Toplam Gelir</h2></div>
        <p className="text-3xl font-bold text-white">{stats.revenue.toLocaleString('tr-TR')} ₺</p>
      </div>
    </div>
  );
}