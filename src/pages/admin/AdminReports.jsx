import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Users, Film, CreditCard, TrendingUp, DollarSign, Eye } from 'lucide-react';

export default function AdminReports() {
  const [data, setData] = useState({ users: 0, movies: 0, payments: [], tickets: 0, revenue: 0, activeUsers: 0, topMovies: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [users, movies, payments, tickets, presence, watchlists] = await Promise.all([
          base44.entities.User.list().catch(() => []),
          base44.entities.Movie.list().catch(() => []),
          base44.entities.Payment.filter({ status: 'completed' }).catch(() => []),
          base44.entities.Notification.filter({ type: 'support_ticket' }).catch(() => []),
          base44.entities.UserPresence.filter({ is_online: true }).catch(() => []),
          base44.entities.Watchlist.list().catch(() => []),
        ]);
        const movieCounts = {};
        watchlists.forEach((w) => { if (w.movie_id) movieCounts[w.movie_id] = (movieCounts[w.movie_id] || 0) + 1; });
        const topMovies = Object.entries(movieCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({ movie: movies.find((m) => m.id === id), count })).filter((x) => x.movie);
        setData({
          users: users.length,
          movies: movies.length,
          payments,
          tickets: tickets.length,
          revenue: payments.reduce((s, p) => s + (p.amount || 0), 0),
          activeUsers: presence.length,
          topMovies,
        });
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  const cards = [
    { label: 'Toplam Kullanıcı', value: data.users, icon: Users, color: 'text-blue-400' },
    { label: 'Çevrimiçi Kullanıcı', value: data.activeUsers, icon: Eye, color: 'text-green-400' },
    { label: 'Toplam Film', value: data.movies, icon: Film, color: 'text-purple-400' },
    { label: 'Destek Talepleri', value: data.tickets, icon: TrendingUp, color: 'text-amber-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Raporlar</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-2"><c.icon className={`w-6 h-6 ${c.color}`} /></div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-4"><DollarSign className="w-5 h-5 text-green-400" /><h2 className="text-lg font-semibold text-white">Gelir Özeti</h2></div>
          <p className="text-3xl font-bold text-white mb-2">{data.revenue.toLocaleString('tr-TR')} ₺</p>
          <p className="text-sm text-muted-foreground">{data.payments.length} başarılı ödeme</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-4"><Eye className="w-5 h-5 text-purple-400" /><h2 className="text-lg font-semibold text-white">En Çok İzlenenler</h2></div>
          <div className="space-y-2">
            {data.topMovies.length === 0 ? <p className="text-sm text-muted-foreground">Veri yok</p> : data.topMovies.map((m, i) => (
              <div key={m.movie.id} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
                <span className="flex-1 text-sm text-white truncate">{m.movie.title}</span>
                <span className="text-sm text-muted-foreground">{m.count} izleme</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}